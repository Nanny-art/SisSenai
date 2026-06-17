const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();

// Configurações do Servidor
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Necessário para o carrinho de compras e atualizações (JSON)
app.use(express.static('.')); // Serve seus arquivos HTML, CSS e imagens

// Conexão com o Banco de Dados
const db = new sqlite3.Database('./sissenai.db');

// Inicialização das Tabelas (Cria apenas se não existirem)[cite: 2]
db.serialize(() => {
    // Tabela de Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        nome TEXT, 
        cpf TEXT, 
        telefone TEXT
    )`);

    // Tabela de Produtos (Estoque)
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        descricao TEXT, 
        preco REAL, 
        estoque INTEGER
    )`);

    // Tabela Mestre de Vendas
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        cliente_id INTEGER, 
        data TEXT, 
        total REAL, 
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    )`);

    // Tabela Detalhe de Itens da Venda
    db.run(`CREATE TABLE IF NOT EXISTS itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        venda_id INTEGER, 
        produto_id INTEGER, 
        quantidade INTEGER, 
        preco_unitario REAL, 
        FOREIGN KEY (venda_id) REFERENCES vendas (id), 
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
    )`);
});

// --- ROTAS DE CLIENTES ---

// Salvar novo cliente
app.post('/salvar-cliente', (req, res) => {
    const { nome, cpf, telefone } = req.body;
    db.run(`INSERT INTO clientes (nome, cpf, telefone) VALUES (?, ?, ?)`, [nome, cpf, telefone], (err) => {
        if (err) return res.status(500).send(err.message);
        res.redirect('/clientes.html');
    });
});

// Listar todos os clientes
app.get('/listar-clientes', (req, res) => {
    db.all("SELECT * FROM clientes", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// *** NOVA ROTA: Alterar cliente existente ***
app.put('/alterar-cliente/:id', (req, res) => {
    const { id } = req.params;
    const { nome, cpf, telefone } = req.body;
    const sql = `UPDATE clientes SET nome = ?, cpf = ?, telefone = ? WHERE id = ?`;
    
    db.run(sql, [nome, cpf, telefone, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// *** NOVA ROTA: Excluir cliente ***
app.delete('/excluir-cliente/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM clientes WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// --- ROTAS DE PRODUTOS (ESTOQUE) ---
app.post('/salvar-produto', (req, res) => {
    const { descricao, preco, estoque } = req.body;
    db.run(`INSERT INTO produtos (descricao, preco, estoque) VALUES (?, ?, ?)`, [descricao, preco, estoque], (err) => {
        if (err) return res.status(500).send(err.message);
        res.redirect('/produtos.html');
    });
});

app.get('/listar-produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// --- ROTAS DE VENDAS ---

// Finalizar Venda (Grava Mestre e Detalhes)
app.post('/finalizar-venda', (req, res) => {
    const { cliente_id, total, itens } = req.body;
    const data = new Date().toLocaleString('pt-BR');

    db.run(`INSERT INTO vendas (cliente_id, data, total) VALUES (?, ?, ?)`, [cliente_id, data, total], function (err) {
        if (err) return res.status(500).json(err);

        const vendaId = this.lastID;
        const stmt = db.prepare(`INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)`);

        itens.forEach(item => {
            stmt.run(vendaId, item.id, item.qtd, item.preco);
        });

        stmt.finalize();
        res.json({ success: true });
    });
});

// Listar todas as Vendas (Mestre)
app.get('/listar-vendas', (req, res) => {
    const sql = `
        SELECT v.id, v.data, v.total, c.nome as nome_cliente 
        FROM vendas v 
        INNER JOIN clientes c ON v.cliente_id = c.id 
        ORDER BY v.id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// Listar itens de uma venda específica (Detalhe)
app.get('/detalhes-venda/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT i.*, p.descricao 
        FROM itens_venda i 
        INNER JOIN produtos p ON i.produto_id = p.id 
        WHERE i.venda_id = ?`;

    db.all(sql, [id], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// Iniciar Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`SISSENAI 1.0 - RODANDO EM: http://localhost:${PORT}`);
    console.log(`=========================================`);
});
