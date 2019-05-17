// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import {
    BlockParam,
    BlockParamLiteral,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type SwapEventArgs =
    | SwapSwapEventArgs
    | SwapCancelEventArgs
    | SwapAuthorizationEventArgs
    | SwapRevocationEventArgs;

export enum SwapEvents {
    Swap = 'Swap',
    Cancel = 'Cancel',
    Authorization = 'Authorization',
    Revocation = 'Revocation',
}

export interface SwapSwapEventArgs extends DecodedLogArgs {
    id: BigNumber;
    makerAddress: string;
    makerParam: BigNumber;
    makerToken: string;
    takerAddress: string;
    takerParam: BigNumber;
    takerToken: string;
    affiliateAddress: string;
    affiliateParam: BigNumber;
    affiliateToken: string;
}

export interface SwapCancelEventArgs extends DecodedLogArgs {
    id: BigNumber;
    makerAddress: string;
}

export interface SwapAuthorizationEventArgs extends DecodedLogArgs {
    approverAddress: string;
    delegateAddress: string;
    expiry: BigNumber;
}

export interface SwapRevocationEventArgs extends DecodedLogArgs {
    approverAddress: string;
    delegateAddress: string;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class SwapContract extends BaseContract {
    public makerOrderStatus = {
        async callAsync(
            index_0: string,
            index_1: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('makerOrderStatus(address,uint256)', [index_0,
        index_1
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('makerOrderStatus(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public revoke = {
        async sendTransactionAsync(
            delegate: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('revoke(address)', [delegate
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.revoke.estimateGasAsync.bind(
                    self,
                    delegate
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            delegate: string,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` may be omitted on its own, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            //
            const self = this as any as SwapContract;
            const txHashPromise = self.revoke.sendTransactionAsync(delegate
    , txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        async estimateGasAsync(
            delegate: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('revoke(address)', [delegate
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            delegate: string,
        ): string {
            const self = this as any as SwapContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('revoke(address)', [delegate
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            delegate: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('revoke(address)', [delegate
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('revoke(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public authorize = {
        async sendTransactionAsync(
            delegate: string,
            expiry: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('authorize(address,uint256)', [delegate,
    expiry
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.authorize.estimateGasAsync.bind(
                    self,
                    delegate,
                    expiry
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            delegate: string,
            expiry: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` may be omitted on its own, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            //
            const self = this as any as SwapContract;
            const txHashPromise = self.authorize.sendTransactionAsync(delegate,
    expiry
    , txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        async estimateGasAsync(
            delegate: string,
            expiry: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('authorize(address,uint256)', [delegate,
    expiry
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            delegate: string,
            expiry: BigNumber,
        ): string {
            const self = this as any as SwapContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('authorize(address,uint256)', [delegate,
    expiry
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            delegate: string,
            expiry: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('authorize(address,uint256)', [delegate,
        expiry
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('authorize(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public swap = {
        async sendTransactionAsync(
            order: {id: BigNumber;expiry: BigNumber;maker: {wallet: string;token: string;param: BigNumber};taker: {wallet: string;token: string;param: BigNumber};affiliate: {wallet: string;token: string;param: BigNumber}},
            signature: {signer: string;r: string;s: string;v: number|BigNumber;version: string},
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swap((uint256,uint256,(address,address,uint256),(address,address,uint256),(address,address,uint256)),(address,bytes32,bytes32,uint8,bytes1))', [order,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.swap.estimateGasAsync.bind(
                    self,
                    order,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            order: {id: BigNumber;expiry: BigNumber;maker: {wallet: string;token: string;param: BigNumber};taker: {wallet: string;token: string;param: BigNumber};affiliate: {wallet: string;token: string;param: BigNumber}},
            signature: {signer: string;r: string;s: string;v: number|BigNumber;version: string},
            txData?: Partial<TxDataPayable> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` may be omitted on its own, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            //
            const self = this as any as SwapContract;
            const txHashPromise = self.swap.sendTransactionAsync(order,
    signature
    , txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        async estimateGasAsync(
            order: {id: BigNumber;expiry: BigNumber;maker: {wallet: string;token: string;param: BigNumber};taker: {wallet: string;token: string;param: BigNumber};affiliate: {wallet: string;token: string;param: BigNumber}},
            signature: {signer: string;r: string;s: string;v: number|BigNumber;version: string},
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swap((uint256,uint256,(address,address,uint256),(address,address,uint256),(address,address,uint256)),(address,bytes32,bytes32,uint8,bytes1))', [order,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {id: BigNumber;expiry: BigNumber;maker: {wallet: string;token: string;param: BigNumber};taker: {wallet: string;token: string;param: BigNumber};affiliate: {wallet: string;token: string;param: BigNumber}},
            signature: {signer: string;r: string;s: string;v: number|BigNumber;version: string},
        ): string {
            const self = this as any as SwapContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('swap((uint256,uint256,(address,address,uint256),(address,address,uint256),(address,address,uint256)),(address,bytes32,bytes32,uint8,bytes1))', [order,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {id: BigNumber;expiry: BigNumber;maker: {wallet: string;token: string;param: BigNumber};taker: {wallet: string;token: string;param: BigNumber};affiliate: {wallet: string;token: string;param: BigNumber}},
            signature: {signer: string;r: string;s: string;v: number|BigNumber;version: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swap((uint256,uint256,(address,address,uint256),(address,address,uint256),(address,address,uint256)),(address,bytes32,bytes32,uint8,bytes1))', [order,
        signature
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('swap((uint256,uint256,(address,address,uint256),(address,address,uint256),(address,address,uint256)),(address,bytes32,bytes32,uint8,bytes1))');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public swapSimple = {
        async sendTransactionAsync(
            id: BigNumber,
            makerWallet: string,
            makerParam: BigNumber,
            makerToken: string,
            takerWallet: string,
            takerParam: BigNumber,
            takerToken: string,
            expiry: BigNumber,
            r: string,
            s: string,
            v: number|BigNumber,
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swapSimple(uint256,address,uint256,address,address,uint256,address,uint256,bytes32,bytes32,uint8)', [id,
    makerWallet,
    makerParam,
    makerToken,
    takerWallet,
    takerParam,
    takerToken,
    expiry,
    r,
    s,
    v
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.swapSimple.estimateGasAsync.bind(
                    self,
                    id,
                    makerWallet,
                    makerParam,
                    makerToken,
                    takerWallet,
                    takerParam,
                    takerToken,
                    expiry,
                    r,
                    s,
                    v
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            id: BigNumber,
            makerWallet: string,
            makerParam: BigNumber,
            makerToken: string,
            takerWallet: string,
            takerParam: BigNumber,
            takerToken: string,
            expiry: BigNumber,
            r: string,
            s: string,
            v: number|BigNumber,
            txData?: Partial<TxDataPayable> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` may be omitted on its own, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            //
            const self = this as any as SwapContract;
            const txHashPromise = self.swapSimple.sendTransactionAsync(id,
    makerWallet,
    makerParam,
    makerToken,
    takerWallet,
    takerParam,
    takerToken,
    expiry,
    r,
    s,
    v
    , txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        async estimateGasAsync(
            id: BigNumber,
            makerWallet: string,
            makerParam: BigNumber,
            makerToken: string,
            takerWallet: string,
            takerParam: BigNumber,
            takerToken: string,
            expiry: BigNumber,
            r: string,
            s: string,
            v: number|BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swapSimple(uint256,address,uint256,address,address,uint256,address,uint256,bytes32,bytes32,uint8)', [id,
    makerWallet,
    makerParam,
    makerToken,
    takerWallet,
    takerParam,
    takerToken,
    expiry,
    r,
    s,
    v
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            id: BigNumber,
            makerWallet: string,
            makerParam: BigNumber,
            makerToken: string,
            takerWallet: string,
            takerParam: BigNumber,
            takerToken: string,
            expiry: BigNumber,
            r: string,
            s: string,
            v: number|BigNumber,
        ): string {
            const self = this as any as SwapContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('swapSimple(uint256,address,uint256,address,address,uint256,address,uint256,bytes32,bytes32,uint8)', [id,
    makerWallet,
    makerParam,
    makerToken,
    takerWallet,
    takerParam,
    takerToken,
    expiry,
    r,
    s,
    v
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            id: BigNumber,
            makerWallet: string,
            makerParam: BigNumber,
            makerToken: string,
            takerWallet: string,
            takerParam: BigNumber,
            takerToken: string,
            expiry: BigNumber,
            r: string,
            s: string,
            v: number|BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('swapSimple(uint256,address,uint256,address,address,uint256,address,uint256,bytes32,bytes32,uint8)', [id,
        makerWallet,
        makerParam,
        makerToken,
        takerWallet,
        takerParam,
        takerToken,
        expiry,
        r,
        s,
        v
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('swapSimple(uint256,address,uint256,address,address,uint256,address,uint256,bytes32,bytes32,uint8)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public cancel = {
        async sendTransactionAsync(
            ids: BigNumber[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('cancel(uint256[])', [ids
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancel.estimateGasAsync.bind(
                    self,
                    ids
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            ids: BigNumber[],
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` may be omitted on its own, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            //
            const self = this as any as SwapContract;
            const txHashPromise = self.cancel.sendTransactionAsync(ids
    , txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        async estimateGasAsync(
            ids: BigNumber[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('cancel(uint256[])', [ids
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            ids: BigNumber[],
        ): string {
            const self = this as any as SwapContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('cancel(uint256[])', [ids
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            ids: BigNumber[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as SwapContract;
            const encodedData = self._strictEncodeArguments('cancel(uint256[])', [ids
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('cancel(uint256[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<SwapContract> {
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return SwapContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<SwapContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Swap successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new SwapContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('Swap', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
