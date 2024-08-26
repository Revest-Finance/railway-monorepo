import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "oracles" })
export class Oracle {
    @PrimaryColumn({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @PrimaryColumn({ name: "asset", type: "text", nullable: false })
    asset: string;

    @Column({ name: "oracle", type: "text", nullable: false, comment: "address of oracle" })
    oracleAddress: string;

    @Column({ name: "ts", type: "int", nullable: false, comment: "block timestamp" })
    timestamp: number;
}
