import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ ssl: false });

export default pool;
