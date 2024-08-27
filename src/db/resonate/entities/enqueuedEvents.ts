import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity({ name: "enqueued_events", comment: "Stores all enqueue events on Resonate contracts" })
export class EnqueuedEvents {
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id: string;

    @Index()
    @Column({ name: "chain_id", type: "int", nullable: false })
    chainId: number;

    @Index()
    @Column({ name: "pool_id", type: "text", nullable: false })
    poolId: string;

    @Column({ name: "position", type: "int", nullable: false })
    position: number;

    @Column({
        name: "side",
        type: "enum",
        enum: ["EnqueueConsumer", "EnqueueProvider"],
        nullable: false,
        comment: "The side of the enqueue event",
    })
    side: "EnqueueConsumer" | "EnqueueProvider";

    @Column({
        name: "should_farm",
        type: "boolean",
        nullable: false,
        comment: "Whether the enqueue event should farm",
    })
    shouldFarm: boolean;

    @Column({
        name: "address",
        type: "text",
        nullable: false,
        comment: "The address of one submitting the transaction",
    })
    address: string;

    @Column({
        name: "packets_remaining",
        type: "text",
        nullable: false,
        comment: "The order packets remaining after the enqueue event",
    })
    packetsRemaining: string;

    @Column({
        name: "deposited_shares",
        type: "text",
        nullable: false,
        comment: "The exchange rate of the order after the enqueue event",
    })
    depositedShares: string;

    @Column({
        name: "order_owner",
        type: "text",
        nullable: false,
        comment: "The order owner",
    })
    orderOwner: string;

    @Column({ name: "block_number", type: "int", nullable: false })
    blockNumber: number;

    @Column({
        name: "block_timestamp",
        type: "timestamp",
        nullable: false,
        comment: "The timestamp of the enqueue event",
    })
    blockTimestamp: Date;

    @Column({
        name: "last_known_block",
        type: "int",
        nullable: false,
        comment: "The last known block number",
    })
    lastKnownBlock: number;

    @Column({ name: "tx_hash", type: "text", nullable: false })
    transactionHash: string;
}
