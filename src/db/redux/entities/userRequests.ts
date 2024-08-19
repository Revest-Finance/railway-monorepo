import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from "typeorm";
import { ColumnNumericTransformer } from "../../utils";
import { ReduxProcessingEvent } from "./processingEvents";

@Entity({ name: "redux_requests" })
@Check(`type IN ('DepositRequestProcessed', 'RedeemRequestProcessed')`)
export class ReduxRequest {
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id: string;

    @Column({ name: "processing_event_id", type: "uuid", nullable: true })
    processingEventId: string;

    @Column({ name: "type", type: "varchar", nullable: true })
    type: string;

    @Column({ name: "user_address", type: "varchar", length: 42, nullable: false })
    userAddress: string;

    @Column({ name: "shares", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    shares: number;

    @Column({ name: "assets", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    assets: number;

    @ManyToOne(() => ReduxProcessingEvent)
    @JoinColumn({ name: "processing_event_id" })
    processingEvent: ReduxProcessingEvent;
}
