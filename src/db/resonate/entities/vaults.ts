import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "vaults" })
export class Vault {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @Column({ name: "address", type: "text", nullable: false })
    address: string;

    @Column({ name: "name", type: "text", nullable: false })
    name: string;

    @Column({ name: "symbol", type: "text", nullable: false })
    symbol: string;

    @Column({ name: "logo", type: "text", nullable: true })
    logo: string | null;

    @Column({ name: "url", type: "text", nullable: true })
    url: string | null;

    @Column({ name: "provider", type: "text", nullable: false })
    provider: string;

    @Column({ name: "providerlogo", type: "text", nullable: true })
    providerLogo: string | null;

    @Column({ name: "providerurl", type: "text", nullable: true })
    providerUrl: string | null;

    @Column({ name: "apy", type: "real", nullable: false, default: 0 })
    apy: number;

    @Column({ name: "tvl", type: "money", nullable: false, default: "$0.00" })
    tvl: string;

    @Column({ name: "status", type: "int", nullable: false, default: 1, comment: "1 = normal, 2 = no farming" })
    status: number;
}
