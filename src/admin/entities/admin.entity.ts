import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'tbl_admin' })
export class Admin {
  @PrimaryGeneratedColumn({ name: 'admin_id' })
  adminId: number;

  @Column({ name: 'admin_name', length: 100 })
  adminName: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'mobile_number', length: 20 })
  mobileNumber: string;

  @Column({ length: 255 })
  password: string;

  @Column({ name: 'role_id', default: 1 })
  roleId: number;

  @Column({ nullable: true, length: 255 })
  photo: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
