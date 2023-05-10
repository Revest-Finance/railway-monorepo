import { Contract, getAddress } from "ethers"
import { fnftHandlerABI, outputReceiverABI, priceProviderABI, resonateABI, tokenVaultABI } from "./abi"
import { E6_addresses, PROVIDERS, fnft_handler_addresses, output_receiver_addresses, price_provider_addresses, token_vault_addresses } from "./constants"

export const isE6 = (asset: string, chainid: number): boolean => { return E6_addresses[chainid].includes(getAddress(asset)) } 

export const resonate_contracts: {[chainId: number] : Contract} = {
    1 : new Contract("0x80CA847618030Bc3e26aD2c444FD007279DaF50A", resonateABI, PROVIDERS[1]),
    10 : new Contract("0x80CA847618030Bc3e26aD2c444FD007279DaF50A", resonateABI, PROVIDERS[10]),
    137 : new Contract("0x6ECB87A158c41d21c82C65B2D8a67Ea435804f64", resonateABI, PROVIDERS[137]),
    250 : new Contract("0x80CA847618030Bc3e26aD2c444FD007279DaF50A", resonateABI, PROVIDERS[250]),
    42161 : new Contract("0x80CA847618030Bc3e26aD2c444FD007279DaF50A", resonateABI, PROVIDERS[42161]),
    31337 : new Contract("0x80CA847618030Bc3e26aD2c444FD007279DaF50A", resonateABI, PROVIDERS[31337])
}

export const price_provider_contracts: {[chainId: number] : Contract} = {
    1 : new Contract(price_provider_addresses[1], priceProviderABI, PROVIDERS[1]),
    10 : new Contract(price_provider_addresses[10], priceProviderABI, PROVIDERS[10]),
    137 : new Contract(price_provider_addresses[137], priceProviderABI, PROVIDERS[137]),
    250 : new Contract(price_provider_addresses[250], priceProviderABI, PROVIDERS[250]),
    42161 : new Contract(price_provider_addresses[42161], priceProviderABI, PROVIDERS[42161])
}

export const token_vault_contracts: {[chainId: number] : Contract} = {
    1 : new Contract(token_vault_addresses[1], tokenVaultABI, PROVIDERS[1]),
    10 : new Contract(token_vault_addresses[10], tokenVaultABI, PROVIDERS[10]),
    137 : new Contract(token_vault_addresses[137], tokenVaultABI, PROVIDERS[137]),
    250 : new Contract(token_vault_addresses[250], tokenVaultABI, PROVIDERS[250]),
    42161 : new Contract(token_vault_addresses[42161], tokenVaultABI, PROVIDERS[42161])
}

export const output_receiver_contracts: {[chainId: number] : Contract} = {
    1 : new Contract(output_receiver_addresses[1], outputReceiverABI, PROVIDERS[1]),
    10 : new Contract(output_receiver_addresses[10], outputReceiverABI, PROVIDERS[10]),
    137 : new Contract(output_receiver_addresses[137], outputReceiverABI, PROVIDERS[137]),
    250 : new Contract(output_receiver_addresses[250], outputReceiverABI, PROVIDERS[250]),
    42161 : new Contract(output_receiver_addresses[42161], outputReceiverABI, PROVIDERS[42161])
}

export const fnft_handler_contract: {[chainId: number] : Contract} = {
    1 : new Contract(fnft_handler_addresses[1], fnftHandlerABI, PROVIDERS[1]),
    10 : new Contract(fnft_handler_addresses[10], fnftHandlerABI, PROVIDERS[10]),
    137 : new Contract(fnft_handler_addresses[137], fnftHandlerABI, PROVIDERS[137]),
    250 : new Contract(fnft_handler_addresses[250], fnftHandlerABI, PROVIDERS[250]),
    42161 : new Contract(fnft_handler_addresses[42161], fnftHandlerABI, PROVIDERS[42161])
}