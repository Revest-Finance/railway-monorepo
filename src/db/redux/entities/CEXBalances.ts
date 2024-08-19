import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ColumnNumericTransformer } from "../../utils";

@Entity({ name: "statistics_balance" })
export class StatisticsBalance {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "timestamp", type: "timestamp", nullable: false })
    timestamp: Date;

    @Column({ name: "balance", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    balance: number;
}
