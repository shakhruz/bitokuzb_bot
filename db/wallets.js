// wallets.js
class WalletsTable {
    constructor(dao) {
      this.dao = dao
    }
  
    createTable() {
      const sql = `
      CREATE TABLE IF NOT EXISTS Wallets (
        public_key string NOT NULL PRIMARY KEY,
        token string NOT NULL,
        user_id string NOT NULL,
        address string,
        mnemonic string,
        private_key text,
            FOREIGN KEY (user_id) REFERENCES Users(id)
      );`
      return this.dao.run(sql)
    }
}
  
module.exports = WalletsTable;