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

// Better Auth: modelo `session`.
@Entity({ schema: USR_SCHEMA, name: 'usr_session' })
export class UsrSession {
  @PrimaryColumn('text')
  id: string;

  @Column('timestamptz')
  expiresAt: Date;

  @Column('text', { unique: true })
  token: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column('text', { nullable: true })
  ipAddress: string | null;

  @Column('text', { nullable: true })
  userAgent: string | null;

  @Index()
  @Column('text')
  userId: string;

  @ManyToOne(() => UsrUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<UsrUser>;
}
