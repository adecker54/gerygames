// ================================================================
// AUTH.JS - Web3 azonosítás (MetaMask, WalletConnect)
// ================================================================

export class AuthManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        this.supportedWallets = ['metamask', 'walletconnect'];
        this.initialized = false;
    }

    async init() {
        try {
            // Ellenőrizzük, hogy van-e MetaMask
            if (typeof window.ethereum !== 'undefined') {
                this.provider = window.ethereum;
                console.log('✅ MetaMask észlelve');
                
                // Eseményfigyelők
                this.provider.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        this.disconnect();
                    } else {
                        this.address = accounts[0];
                        this.isConnected = true;
                        this.onConnectCallback?.(this.address);
                    }
                });

                this.provider.on('chainChanged', (chainId) => {
                    this.chainId = chainId;
                    window.location.reload();
                });

                this.provider.on('disconnect', () => {
                    this.disconnect();
                });

            } else {
                console.log('ℹ️ Nincs MetaMask, WalletConnect-ot próbáljuk');
                // WalletConnect betöltése (ha szükséges)
                try {
                    // Dinamikus import a WalletConnect-hez
                    const { WalletConnectProvider } = await import('@walletconnect/web3-provider');
                    this.wcProvider = new WalletConnectProvider({
                        infuraId: 'YOUR_INFURA_ID', // Később beállítandó
                    });
                    console.log('✅ WalletConnect elérhető');
                } catch (e) {
                    console.log('ℹ️ WalletConnect nem elérhető, csak MetaMask mód');
                }
            }

            // Ellenőrizzük, hogy már csatlakozva van-e
            if (this.provider) {
                try {
                    const accounts = await this.provider.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        this.address = accounts[0];
                        this.isConnected = true;
                        this.chainId = await this.provider.request({ method: 'eth_chainId' });
                        console.log(`🔗 Már csatlakozva: ${this.address}`);
                    }
                } catch (e) {
                    // Nem csatlakozva
                }
            }

            this.initialized = true;
            return true;

        } catch (error) {
            console.error('❌ Hiba a Web3 inicializálás során:', error);
            return false;
        }
    }

    // Csatlakozás MetaMaskhoz
    async connectMetaMask() {
        try {
            if (!this.provider) {
                throw new Error('Nincs elérhető Web3 provider (telepítsd a MetaMaskot!)');
            }

            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });

            if (accounts && accounts.length > 0) {
                this.address = accounts[0];
                this.isConnected = true;
                this.chainId = await this.provider.request({ method: 'eth_chainId' });
                console.log(`🔗 Csatlakozva: ${this.address}`);
                this.onConnectCallback?.(this.address);
                return this.address;
            }

            throw new Error('Nem sikerült csatlakozni');

        } catch (error) {
            console.error('❌ Csatlakozási hiba:', error);
            if (error.code === 4001) {
                alert('A csatlakozást megtagadtad. Kérlek, engedélyezd a csatlakozást!');
            } else {
                alert(`Hiba a csatlakozás során: ${error.message}`);
            }
            return null;
        }
    }

    // Csatlakozás WalletConnect segítségével
    async connectWalletConnect() {
        try {
            if (!this.wcProvider) {
                throw new Error('WalletConnect nem elérhető');
            }

            await this.wcProvider.enable();
            this.address = this.wcProvider.accounts[0];
            this.isConnected = true;
            this.chainId = this.wcProvider.chainId;
            this.provider = this.wcProvider;
            console.log(`🔗 WalletConnect csatlakozva: ${this.address}`);
            this.onConnectCallback?.(this.address);
            return this.address;

        } catch (error) {
            console.error('❌ WalletConnect hiba:', error);
            alert(`WalletConnect hiba: ${error.message}`);
            return null;
        }
    }

    // Általános csatlakozás (először MetaMask, majd WalletConnect)
    async connect() {
        if (this.isConnected) {
            return this.address;
        }

        // Először MetaMask
        if (typeof window.ethereum !== 'undefined') {
            const result = await this.connectMetaMask();
            if (result) return result;
        }

        // Ha nincs MetaMask vagy sikertelen, próbáljuk WalletConnect
        if (this.wcProvider) {
            return await this.connectWalletConnect();
        }

        alert('Nincs elérhető tárca! Kérlek, telepítsd a MetaMaskot vagy használj WalletConnect-ot.');
        return null;
    }

    // Lekapcsolódás
    disconnect() {
        this.address = null;
        this.isConnected = false;
        this.onDisconnectCallback?.();
        console.log('🔌 Lekapcsolódva');
    }

    // Ellenőrizzük, hogy csatlakozva van-e
    isConnected() {
        return this.isConnected;
    }

    // Cím lekérése
    getAddress() {
        return this.address;
    }

    // Cím rövidítve (megjelenítéshez)
    getShortAddress() {
        if (!this.address) return '';
        return `${this.address.substring(0, 6)}...${this.address.substring(this.address.length - 4)}`;
    }

    // Eseményfigyelők
    onConnect(callback) {
        this.onConnectCallback = callback;
    }

    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }

    // Aláírás (későbbi használatra)
    async signMessage(message) {
        if (!this.isConnected || !this.provider) {
            throw new Error('Nincs csatlakoztatva tárca');
        }

        try {
            const signature = await this.provider.request({
                method: 'personal_sign',
                params: [message, this.address]
            });
            return signature;
        } catch (error) {
            console.error('❌ Aláírási hiba:', error);
            return null;
        }
    }

    // Hálózat váltás (későbbi használatra)
    async switchNetwork(chainId) {
        if (!this.provider) return false;

        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }]
            });
            this.chainId = chainId;
            return true;
        } catch (error) {
            console.error('❌ Hálózatváltási hiba:', error);
            return false;
        }
    }
}