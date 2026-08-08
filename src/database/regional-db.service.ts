import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class RegionalDbService implements OnModuleDestroy {
  private readonly logger = new Logger(RegionalDbService.name);
  private pools: Map<string, mysql.Pool> = new Map();

  public getPool(regionKey: 'm3south' | 'm3north' | 'm3infrastructure'): mysql.Pool {
    const key = regionKey.toLowerCase();
    if (this.pools.has(key)) {
      return this.pools.get(key)!;
    }

    let host = process.env.DB_HOST || '127.0.0.1';
    let port = Number(process.env.DB_PORT || 3306);
    let user = process.env.DB_USERNAME || 'root';
    let password = process.env.DB_PASSWORD || '';
    let database = '';

    switch (key) {
      case 'm3south':
        host = process.env.DB_SOUTH_HOST || process.env.DB_HOST || host;
        port = Number(process.env.DB_SOUTH_PORT || process.env.DB_PORT || port);
        user = process.env.DB_SOUTH_USERNAME || process.env.DB_SOUTH_USER || process.env.DB_USERNAME || user;
        password = process.env.DB_SOUTH_PASSWORD || process.env.DB_SOUTH_PASS || process.env.DB_PASSWORD || password;
        database = process.env.DB_SOUTH_NAME || 'recent_south';
        break;

      case 'm3north':
        host = process.env.DB_NORTH_HOST || process.env.DB_HOST || host;
        port = Number(process.env.DB_NORTH_PORT || process.env.DB_PORT || port);
        user = process.env.DB_NORTH_USERNAME || process.env.DB_NORTH_USER || process.env.DB_USERNAME || user;
        password = process.env.DB_NORTH_PASSWORD || process.env.DB_NORTH_PASS || process.env.DB_PASSWORD || password;
        database = process.env.DB_NORTH_NAME || 'recent_north';
        break;

      case 'm3infrastructure':
        host = process.env.DB_INFRA_HOST || process.env.DB_HOST || host;
        port = Number(process.env.DB_INFRA_PORT || process.env.DB_PORT || port);
        user = process.env.DB_INFRA_USERNAME || process.env.DB_INFRA_USER || process.env.DB_USERNAME || user;
        password = process.env.DB_INFRA_PASSWORD || process.env.DB_INFRA_PASS || process.env.DB_PASSWORD || password;
        database = process.env.DB_INFRA_NAME || 'recent_infra';
        break;
    }

    this.logger.log(`Initializing MySQL pool for ${key} -> ${user}@${host}:${port}/${database}`);

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    });

    this.pools.set(key, pool);
    return pool;
  }

  async executeQuery(
    regionKey: 'm3south' | 'm3north' | 'm3infrastructure',
    sql: string,
    params: any[] = [],
  ): Promise<any[]> {
    const pool = this.getPool(regionKey);
    try {
      const [rows] = await pool.query(sql, params);
      return rows as any[];
    } catch (err: any) {
      if (err.message && (err.message.includes('ECONNRESET') || err.message.includes('closed'))) {
        this.logger.warn(`MySQL socket reset detected for ${regionKey}, retrying once...`);
        const [rows] = await pool.query(sql, params);
        return rows as any[];
      }
      throw err;
    }
  }

  getDbName(regionKey: 'm3south' | 'm3north' | 'm3infrastructure'): string {
    switch (regionKey.toLowerCase()) {
      case 'm3south':
        return process.env.DB_SOUTH_NAME || 'recent_south';
      case 'm3north':
        return process.env.DB_NORTH_NAME || 'recent_north';
      case 'm3infrastructure':
        return process.env.DB_INFRA_NAME || 'recent_infra';
      default:
        return '';
    }
  }

  async onModuleDestroy() {
    for (const [key, pool] of this.pools.entries()) {
      try {
        await pool.end();
        this.logger.log(`Closed MySQL pool for ${key}`);
      } catch (err) {
        // ignore
      }
    }
  }
}
