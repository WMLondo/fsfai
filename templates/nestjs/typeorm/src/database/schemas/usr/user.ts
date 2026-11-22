import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { USR_SCHEMA } from './schema.js';

// Better Auth: modelo `user`. Las columnas usan los nombres de campo de Better Auth.
@Entity({ schema: USR_SCHEMA, name: 'usr_user' })
export class UsrUser {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true })
  email: string;

  @Column('boolean', { default: false })
  emailVerified: boolean;

  @Column('text', { nullable: true })
  image: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
