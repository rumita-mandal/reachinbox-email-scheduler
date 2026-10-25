import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EmailStatus = 'pending' | 'scheduled' | 'sent' | 'failed' | 'rate_limited';

@Entity('email_jobs')
@Index(['userId', 'status'])
@Index(['senderEmail', 'status'])
export class EmailJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  senderEmail!: string;

  @Column({ type: 'varchar', length: 255, default: 'ReachInbox' })
  senderName!: string;

  @Column({ type: 'varchar', length: 255 })
  recipientEmail!: string;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'timestamp' })
  scheduledAt!: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'scheduled', 'sent', 'failed', 'rate_limited'],
    default: 'pending',
  })
  status!: EmailStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bullJobId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
