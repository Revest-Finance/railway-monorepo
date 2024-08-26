import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";
import { ColumnNumericTransformer } from "../../utils";

@Entity({ name: "redux_processing_events" })
@Unique(["blockNumber"])
export class ReduxProcessingEvent {
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id: string;

    @Column({ name: "total_assets", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    totalAssets: number;

    @Column({ name: "ratio", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    ratio: number;

    @Column({ name: "tx_hash", type: "varchar", nullable: false })
    txHash: string;

    @Column({ name: "block_number", type: "bigint", nullable: false, transformer: new ColumnNumericTransformer() })
    blockNumber: number;

    @Column({
        name: "block_timestamp",
        type: "timestamp",
        nullable: false,
    })
    blockTimestamp: Date;
}
