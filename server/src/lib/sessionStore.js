import session from 'express-session'
import MySQLStoreFactory from 'express-mysql-session'

const MySQLStore = MySQLStoreFactory(session)

const dbUrl = new URL(process.env.DATABASE_URL)
const isLocalHost = ['localhost', '127.0.0.1'].includes(dbUrl.hostname)

export const sessionStore = new MySQLStore({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, '').split('?')[0],
  // Azure Database for MySQL exige TLS; un MySQL local de desarrollo normalmente no.
  ssl: isLocalHost ? undefined : { rejectUnauthorized: true },
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
})
