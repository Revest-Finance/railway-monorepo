import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "fnfts" })
export class Fnft {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @Column({ name: "poolid", type: "text", nullable: false })
    poolId: string;

    @Column({ name: "fnftid", type: "int", nullable: false })
    fnftId: number;

    @Column({ name: "face", type: "real", nullable: false })
    face: number;

    @Column({ name: "quantity", type: "bigint", nullable: false })
    quantity: number;

    @Column({ name: "usd", type: "money", nullable: false })
    usd: string;
}
