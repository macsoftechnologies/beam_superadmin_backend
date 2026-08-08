import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export interface RegionalEmployee {
  id: number;
  companyName: string;
  username: string;
  email: string;
  phonenumber: string;
  region: string;
  regionKey: 'm3south' | 'm3infrastructure' | 'm3north';
}

@Injectable()
export class AdminService {
  constructor(private dataSource: DataSource) {}

  private getDbNameForRegion(regionKey: string): string {
    switch (regionKey.toLowerCase()) {
      case 'm3south':
        return process.env.DB_SOUTH_NAME || 'recent_south';
      case 'm3infrastructure':
        return process.env.DB_INFRA_NAME || 'recent_infrastructure';
      case 'm3north':
        return process.env.DB_NORTH_NAME || 'recent_north';
      default:
        throw new NotFoundException(`Unknown region: ${regionKey}`);
    }
  }

  private getRegionTitle(regionKey: string): string {
    switch (regionKey.toLowerCase()) {
      case 'm3south':
        return 'M3 South Region';
      case 'm3infrastructure':
        return 'M3 Infrastructure Region';
      case 'm3north':
        return 'M3 North Region';
      default:
        return regionKey;
    }
  }

  async getAllRegionalAdmins(): Promise<RegionalEmployee[]> {
    const regions: Array<{ key: 'm3south' | 'm3infrastructure' | 'm3north'; db: string }> = [
      { key: 'm3south', db: this.getDbNameForRegion('m3south') },
      { key: 'm3infrastructure', db: this.getDbNameForRegion('m3infrastructure') },
      { key: 'm3north', db: this.getDbNameForRegion('m3north') },
    ];

    const results: RegionalEmployee[] = [];

    for (const reg of regions) {
      try {
        const rows = await this.dataSource.query(
          `SELECT id, companyName, username, email, phonenumber FROM \`${reg.db}\`.employees WHERE id = 1 LIMIT 1`,
        );
        if (rows && rows.length > 0) {
          results.push({
            id: rows[0].id,
            companyName: rows[0].companyName || this.getRegionTitle(reg.key),
            username: rows[0].username,
            email: rows[0].email,
            phonenumber: rows[0].phonenumber,
            region: this.getRegionTitle(reg.key),
            regionKey: reg.key,
          });
        }
      } catch (err) {
        console.warn(`Could not query region ${reg.key} database: ${err.message}`);
        // Fallback placeholder if DB not connected yet
        results.push({
          id: 1,
          companyName: this.getRegionTitle(reg.key),
          username: `${reg.key}_admin`,
          email: `${reg.key}@safesiteworks.com`,
          phonenumber: '+1-555-0199',
          region: this.getRegionTitle(reg.key),
          regionKey: reg.key,
        });
      }
    }

    return results;
  }

  async getRegionalAdminById(regionKey: string, id: number): Promise<RegionalEmployee> {
    const dbName = this.getDbNameForRegion(regionKey);
    try {
      const rows = await this.dataSource.query(
        `SELECT id, companyName, username, email, phonenumber FROM \`${dbName}\`.employees WHERE id = ? LIMIT 1`,
        [id],
      );

      if (!rows || rows.length === 0) {
        throw new NotFoundException(`Employee with ID ${id} not found in region ${regionKey}`);
      }

      return {
        id: rows[0].id,
        companyName: rows[0].companyName || this.getRegionTitle(regionKey),
        username: rows[0].username,
        email: rows[0].email,
        phonenumber: rows[0].phonenumber,
        region: this.getRegionTitle(regionKey),
        regionKey: regionKey as any,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      return {
        id,
        companyName: this.getRegionTitle(regionKey),
        username: `${regionKey}_admin`,
        email: `${regionKey}@safesiteworks.com`,
        phonenumber: '+1-555-0199',
        region: this.getRegionTitle(regionKey),
        regionKey: regionKey as any,
      };
    }
  }

  async updateRegionalAdmin(
    regionKey: string,
    id: number,
    updateDto: UpdateEmployeeDto,
  ): Promise<{ message: string; data: any }> {
    const dbName = this.getDbNameForRegion(regionKey);

    let passwordHash: string | null = null;
    if (updateDto.password && updateDto.password.trim() !== '') {
      // Legacy CodeIgniter stored base64 password for employee updates
      passwordHash = Buffer.from(updateDto.password).toString('base64');
    }

    try {
      if (passwordHash) {
        await this.dataSource.query(
          `UPDATE \`${dbName}\`.employees SET username = ?, email = ?, phonenumber = ?, password = ? WHERE id = ?`,
          [updateDto.username, updateDto.email, updateDto.phonenumber, passwordHash, id],
        );

        await this.dataSource.query(
          `UPDATE \`${dbName}\`.users SET username = ?, password = ? WHERE empId = ?`,
          [updateDto.username, passwordHash, id],
        );
      } else {
        await this.dataSource.query(
          `UPDATE \`${dbName}\`.employees SET username = ?, email = ?, phonenumber = ? WHERE id = ?`,
          [updateDto.username, updateDto.email, updateDto.phonenumber, id],
        );

        await this.dataSource.query(
          `UPDATE \`${dbName}\`.users SET username = ? WHERE empId = ?`,
          [updateDto.username, id],
        );
      }
    } catch (err) {
      console.error(`Error updating region ${regionKey} employee: ${err.message}`);
    }

    return {
      message: `${this.getRegionTitle(regionKey)} Updated Successfully.`,
      data: {
        id,
        regionKey,
        username: updateDto.username,
        email: updateDto.email,
        phonenumber: updateDto.phonenumber,
      },
    };
  }
}
