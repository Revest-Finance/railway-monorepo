import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "pools" })
export class Pool {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @Column({ name: "poolid", type: "text", nullable: false })
    poolId: string;

    @Column({ name: "payoutasset", type: "text", nullable: false })
    payoutAsset: string;

    @Column({ name: "vault", type: "text", nullable: false })
    vault: string;

    @Column({ name: "vaultasset", type: "text", nullable: false })
    vaultAsset: string;

    @Column({ name: "rate", type: "text", nullable: false })
    rate: string;

    @Column({ name: "addinterestrate", type: "text", nullable: false })
    addInterestRate: string;

    @Column({ name: "lockupperiod", type: "int", nullable: false })
    lockupPeriod: number;

    @Column({ name: "packetsize", type: "text", nullable: false })
    packetSize: string;

    @Column({ name: "packetsizedecimals", type: "int", nullable: false })
    packetSizeDecimals: number;

    @Column({ name: "isfixedterm", type: "boolean", nullable: false })
    isFixedTerm: boolean;

    @Column({ name: "poolname", type: "text", nullable: false })
    poolName: string;

    @Column({ name: "creator", type: "text", nullable: false })
    creator: string;

    @Column({ name: "tx", type: "text", nullable: false })
    tx: string;

    @Column({ name: "ts", type: "int", nullable: false })
    ts: number;

    @Column({ name: "tvl", type: "money", default: "$0.00" })
    tvl: string;

    @Column({ name: "verifiedby", type: "text", nullable: true })
    verifiedBy: string;

    @Column({ name: "usdvolume", type: "money", default: "$0.00" })
    usdVolume: string;

    @Column({
        name: "status",
        type: "int",
        default: 1,
        nullable: false,
        comment: "1 = default, 2 = featured, 3 = degen, 4 = hero, 5 = hashnote",
    })
    status: number;
}
