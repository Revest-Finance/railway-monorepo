import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "tokens" })
export class Token {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @Column({ name: "decimals", type: "int", nullable: false })
    decimals: number;

    @Column({ name: "logo", type: "text", nullable: true })
    logo: string | null;

    @Column({ name: "name", type: "text", nullable: false })
    name: string;

    @Column({ name: "symbol", type: "text", nullable: false })
    symbol: string;
}
