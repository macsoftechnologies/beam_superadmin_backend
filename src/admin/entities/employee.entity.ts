import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'companyName', length: 100 })
  companyName: string;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20 })
  phonenumber: string;

  @Column({ length: 255 })
  password: string;

  // Virtual property to identify region in API responses
  region?: string;
}
