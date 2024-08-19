import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "adapters" })
export class Adapter {
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id: string;

    @Column({ name: "vault", type: "text", nullable: false })
    vault: string;

    @Column({ name: "adapter", type: "text", nullable: false })
    adapter: string;

    @Column({ name: "asset", type: "text", nullable: false })
    asset: string;

    @Column({ name: "block_number", type: "int", nullable: true, default: 0 })
    blockNumber: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;
}
