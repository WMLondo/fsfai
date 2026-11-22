import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { USR_SCHEMA } from './schema.js';

// Better Auth: modelo `verification` (tokens de verificación de email, reseteo de contraseña...).
@Entity({ schema: USR_SCHEMA, name: 'usr_verification' })
export class UsrVerification {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column('text')
  identifier: string;

  @Column('text')
  value: string;

  @Column('timestamptz')
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
