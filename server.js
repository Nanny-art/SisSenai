const express = require('express');
const sqlte3 = require('sqlite3').verbose();
const bodyParser = require('body-parse');
const app = express();

//Configurações do Servidor
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());//Necessário para o carinho de compras (JSON)
app.use(express.static('.')); //Serve seus arquivos HTML, CSS e imagens

//Conexão com o Banco de Dados
const db = new sqlite3.Database('./sissenai.db');

//Inicialização das Tabelas (Cria apenas se não existirem)
db.serialize(() => {
  //Tabela de Clientes
  db.run(`CREATE TABLE IF NOT EXISTS clientes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  cpf TEXT,
  telefone TEXT
  )`);

  //---ROTAS DE CLIENTES---
  app.post('/salvar-clientes', (req,res) =>{
    const{nome, cpf, telefone} = req.body;
    db.run (`INSERT INTO cientes (nome, cpf, telefone) VALUES (?,?,?)`,[nome, cpf, telefone],(err) =>{
      if(err) return res.status(500).send9err.message);
      res.redirect('/clientes.html');
    });
  });

  app.get('/listar-clientes', (req, res) =>{
    db.all("SELECT * FROM clientes', [], (err, rows)=>{
           if(err) return res.status(500).json(err);
    res.json(rows);
  });
});

ALTERAR O ARQUIVO SERVER.JS
//***NOVA ROTA: Alterar cliente existente***|Acrescentar tudo
app.put('/alterar-cliente/:id', (req, res)=>{
    const{id}= req.params;
    const{nome,cpf, telefone} = req.body;
    const sql= `UPDATE clientes SETT nome = ?, cpf=?, telefone= ? WHERE id= ?`;

  db.run(sql, [nome,cpf,telefone,id], (err)=>{
    if(err) return res.status(500).json({error:err.message });
    res.json({success: true});
  });
});
//***NOVA ROTA: Excluir cliente*** \ Acrescentar tudo
app.delete('/excluir-cliente/:id',(req, res)=>{
  const{id}= req.params;
  db.run(`DELETE FROM clientes WHERE id = ?`, [id], (err)=>{
    if(err) return ress.status(500).json({error: err.message});
    res.json({success: true});
  });
});

//Iniciar Servidor
const PORT = 3000;
app.listen(PORT,()=>{
  console.log(`=========================================`);
  console.log(´SISSENAI RODANDO EM: http://localhost:${Port}`);
  console.log(`=========================================`);
});
