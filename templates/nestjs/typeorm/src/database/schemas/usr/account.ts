import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { USR_SCHEMA } from './schema.js';
import { UsrUser } from './user.js';

// Better Auth: modelo `account` (credenciales y proveedores de cada usuario).
@Entity({ schema: USR_SCHEMA, name: 'usr_account' })
export class UsrAccount {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  accountId: string;

  @Column('text')
  providerId: string;

  @Index()
  @Column('text')
  userId: string;

  @ManyToOne(() => UsrUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<UsrUser>;

  @Column('text', { nullable: true })
  accessToken: string | null;

  @Column('text', { nullable: true })
  refreshToken: string | null;

  @Column('text', { nullable: true })
  idToken: string | null;

  @Column('timestamptz', { nullable: true })
  accessTokenExpiresAt: Date | null;

  @Column('timestamptz', { nullable: true })
  refreshTokenExpiresAt: Date | null;

  @Column('text', { nullable: true })
  scope: string | null;

  @Column('text', { nullable: true })
  password: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
