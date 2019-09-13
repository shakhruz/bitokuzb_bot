// wallets.js
class WalletsTable {
    constructor(dao) {
      this.dao = dao
    }
  
    createTable() {
      const sql = `
      CREATE TABLE IF NOT EXISTS Wallets (
        public_key text NOT NULL PRIMARY KEY,
        token text NOT NULL,
        user_id text NOT NULL,
        address text,
        mnemonic text,
        private_key text,
            FOREIGN KEY (user_id) REFERENCES Users(id)
      );`
      return this.dao.run(sql)
    }
}
  
module.exports = WalletsTable;