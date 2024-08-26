import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "xrates" })
export class XRate {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "chainid", type: "int", nullable: false })
    chainId: number;

    @Column({ name: "token", type: "text", nullable: false })
    token: string;

    @Column({ name: "address", type: "text", nullable: false })
    address: string;

    @Column({ name: "xrate", type: "real", nullable: false, default: 0 })
    xRate: number;

    @Column({ name: "isLP", type: "boolean", nullable: false, default: false })
    isLP: boolean;
}
