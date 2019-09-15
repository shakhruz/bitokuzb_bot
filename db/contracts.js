// contracts.js
var sha256 = require('js-sha256');
// status: new, completed, error

class ContractsTable {
    constructor(dao) {
      this.dao = dao
    }
  
    createTable() {
      const sql = `
      CREATE TABLE IF NOT EXISTS Contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash text NOT NULL,
        user_id text NOT NULL,
        datetime time,
        sell_coin text NOT NULL,
        sell_amount text NOT NULL,
        sell_amount_usd text NOT NULL,
        buy_coin text NOT NULL,
        buy_amount text NOT NULL,
        status text NOT NULL,
        incoming_tx text,
        outgoing_tx text,
        fee_sat INTEGER,
        fee_usd text,
        rate_market text,
        rate_real text, 
        comm_rate text,
        comm_usd text,
        comm_sum text,
        comm_btc text,
    
        from_address text,
        to_address text,
            FOREIGN KEY (user_id) REFERENCES Users(id)
            FOREIGN KEY (user_id) REFERENCES Wallets(user_id)
      );`
      return this.dao.run(sql)
    }

    create(contract) {
        const {user_id, sell_coin, sell_amount, sell_amount_usd, buy_coin, buy_amount, to_address, fee, rate, comm, status, from_address} = contract
        const {fee_sat, fee_usd} = fee
        const now = new Date()
        const hash = sha256.sha256(user_id.toString() + now.toString() + sell_coin + sell_amount + buy_coin + to_address)
        
        console.log("contract datetime: ", now, " hash: ", hash)
        return this.dao.run(
          'INSERT INTO contracts (user_id, datetime, sell_coin, sell_amount, sell_amount_usd, buy_coin, buy_amount, to_address, hash, ' + 
            'fee_sat, fee_usd, rate_market, rate_real, comm_rate, comm_usd, comm_sum, comm_btc, status, from_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [user_id, now, sell_coin, sell_amount, sell_amount_usd, buy_coin, buy_amount, to_address, hash, fee_sat, fee_usd, rate.market, rate.real, 
            comm.rate, comm.usd, comm.sum, comm.btc, status, from_address])
    } 

    update(contract) {
        const { id, hash, user_id, datetime, sell_coin, sell_amount, buy_coin, buy_amount, status, incoming_tx, outgoing_tx, from_address, to_address } = contract
        return this.dao.run(
          `UPDATE contracts SET hash = ?, user_id = ?, datetime =?, sell_coin = ?, sell_amount = ?, buy_coin = ?, buy_amount = ?, status = ?, incoming_tx = ?, outgoing_tx = ?, 
          from_address = ?, to_address = ? WHERE id = ?`,
          [hash, user_id, datetime, sell_coin, sell_amount, buy_coin, buy_amount, status, incoming_tx, outgoing_tx, from_address, to_address, id]
        )
    }

    delete(id) {
        return this.dao.run(
          `DELETE FROM contracts WHERE id = ?`,
          [id]
        )
    }    

    getById(id) {
        return this.dao.get(
          `SELECT * FROM contracts WHERE id = ?`,
          [id])
    }

    getByHash(hash) {
        return this.dao.get(
          `SELECT * FROM contracts WHERE hash = ?`,
          [hash])
    }

    getByUser(user_id) {
        return this.dao.get(
          `SELECT * FROM contracts WHERE user_id = ?`,
          [user_id])
    }

    getAll() {
        return this.dao.all(`SELECT * FROM contracts`)
    }
}
  
module.exports = ContractsTable;