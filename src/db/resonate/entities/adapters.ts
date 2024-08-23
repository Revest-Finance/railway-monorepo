import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "adapters" })
export class Adapter {
    @PrimaryColumn({ name: "vault", type: "text", nullable: false })
    vault: string;

    @Column({ name: "adapter", type: "text", nullable: false })
    adapter: string;

    @Column({ name: "asset", type: "text", nullable: false })
    asset: string;

    @Column({ name: "status", type: "int", nullable: false, default: -1 })
    status?: number;

    @Column({ name: "ts", type: "int", nullable: true, default: 0 })
    ts: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;
}
