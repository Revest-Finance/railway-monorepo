import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ColumnNumericTransformer } from "../../utils";

@Entity({ name: "statistics_percentage" })
export class StatisticsPercentage {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "timestamp", type: "timestamp", nullable: false })
    timestamp: Date;

    @Column({ name: "net_profit", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    netProfit: number;

    @Column({
        name: "buy_and_hold_return",
        type: "numeric",
        nullable: false,
        transformer: new ColumnNumericTransformer(),
    })
    buyAndHoldReturn: number;

    @Column({
        name: "avg_winning_trade",
        type: "numeric",
        nullable: false,
        transformer: new ColumnNumericTransformer(),
    })
    avgWinningTrade: number;

    @Column({ name: "avg_losing_trade", type: "numeric", nullable: false, transformer: new ColumnNumericTransformer() })
    avgLosingTrade: number;

    @Column({
        name: "largest_winning_trade",
        type: "numeric",
        nullable: false,
        transformer: new ColumnNumericTransformer(),
    })
    largestWinningTrade: number;

    @Column({
        name: "largest_losing_trade",
        type: "numeric",
        nullable: false,
        transformer: new ColumnNumericTransformer(),
    })
    largestLosingTrade: number;
}
