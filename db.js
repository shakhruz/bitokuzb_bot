const sqlite3 = require('sqlite3').verbose()
const DB_PATH = './sqlite.db'
const Promise = require('bluebird')

class AppDAO {
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
            console.log('Could not connect to database', err)
        } else {
            console.log('Connected to database')
        }
        })
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
            if (err) {
            console.log('Error running sql ' + sql)
            console.log(err)
            reject(err)
            } else {
            resolve({ id: this.lastID })
            }
        })
        })
    } 
    
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }   

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }  
}

// const Promise = require('bluebird')
const UsersTable = require('./db/users')
const WalletsTable = require('./db/wallets')
const ContractsTable = require('./db/contracts')

// Database and Tables
const dao = new AppDAO('./sqlite.db')
const users = new UsersTable(dao)
const wallets = new WalletsTable(dao)
const contracts = new ContractsTable(dao)

users.createTable()
    .then(() => wallets.createTable())
    .then(() => contracts.createTable())
    .then(() => {
      resolve('success')
    })
    .catch((err) => {
      console.log('Error: ')
      console.log(JSON.stringify(err))
    })


const DB = new sqlite3.Database(DB_PATH, function(err){
    if (err) {
        console.log(err)
        return
    }
    console.log('Connected to ' + DB_PATH + ' database.')

    DB.exec('PRAGMA foreign_keys = ON;', function(error)  {
        if (error){
            console.error("Pragma statement didn't work.")
        } else {
            // console.log("Foreign Key Enforcement is on.")
        }
    });
});

function addContract (contract) {
    // console.log("addContract: ", contract)
    const result = contracts.create(contract)
    // console.log("new contract result: ", result)
    return result
}

function getContract(contract_id, callback) {
    contracts.getById(contract_id).then((contract)=> {callback(contract)})
}

function updateContract(contract_id, new_status) {
    console.log("update contract: ", contract_id, new_status)
    contracts.getById(contract_id).then((contract)=>{
        if (contract && contract !=null) {
            contract.status = new_status
            contracts.update(contract).then((result)=>{
                console.log("updated contracts db: ", result)
            })
        }    
    })
}


function addUser(username, id, first_name, last_name, language_code, callback) {
    console.log("add user: ", username, id, first_name, last_name, language_code)
    var sql= "INSERT INTO Users (id, username, first_name, last_name, language_code) "
    sql += "VALUES (? ,?, ?, ?, ?) "

    DB.run(sql, [id, username, first_name, last_name, language_code], function(error) {
        if (error) {
            console.log(error)
            callback(false)
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
            callback(true)
        }
    });
};

function getUser(id, callback) {
    var sql = 'SELECT id, username, first_name, last_name, language_code '
    sql += 'FROM Users '
    sql += 'WHERE id = ? '

    DB.get(sql, id, function(error, row) {
        if (error) {
            console.log(error)
            callback(null)
            return
        }

        callback(row)
    });
}

function getWallet(user_id, token, callback) {
    var sql = 'SELECT * '
    sql += 'FROM Wallets '
    sql += 'WHERE user_id = ? AND token = ?'


    DB.get(sql, [user_id, token], function(error, row) {
        if (error) {
            console.log(error)
            callback(null)
            return
        }

        callback(row)
    });    
}

function addWallet(token, id, public_key, address, private_key, mnemonic, callback) {
    console.log("add wallet: ", token, id, public_key, address)
    var sql= "INSERT INTO Wallets (public_key, token, user_id, address, mnemonic, private_key) "
    sql += "VALUES (? ,?, ?, ?, ?, ?) "

    DB.run(sql, [public_key, token, id, address, mnemonic, private_key], function(error) {
        if (error) {
            console.log(error)
            callback(false)
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
            callback(true)
        }
    });
};

module.exports = {
    addUser, getUser, getWallet, addWallet, AppDAO,
    dao, UsersTable, WalletsTable, ContractsTable, addContract, getContract, updateContract
}

// DB.close()
// Старая инициация базы данных
// dbSchema = `CREATE TABLE IF NOT EXISTS Users (
//     id text NOT NULL PRIMARY KEY,
//     username text NOT NULL UNIQUE,
//     first_name text,
//     last_name text,
//     language_code text
// );

// CREATE TABLE IF NOT EXISTS Wallets (
//     public_key text NOT NULL PRIMARY KEY,
//     token text NOT NULL,
//     user_id text NOT NULL,
//     address text,
//     mnemonic text,
//     private_key text,
//         FOREIGN KEY (user_id) REFERENCES Users(id)
// );
// `
// DB.exec(dbSchema, function(err){
//     if (err) {
//         console.log(err)
//     }
// });