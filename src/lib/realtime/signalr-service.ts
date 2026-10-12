import { notificationDispatcher } from './notification-dispatcher';
import { subscriptionManager } from './subscription-manager';

export class SignalRService {
    private connection: any = null;
    private isEnabled: boolean = false;
    private isConnected: boolean = false;

    constructor() {
        this.isEnabled = typeof window !== 'undefined' && 
            (window as any).ENABLE_REALTIME_SYNC !== false;
    }

    public async initialize(hubUrl: string, getToken: () => string) {
        if (!this.isEnabled) {
            console.log('Realtime sync is disabled via ENABLE_REALTIME_SYNC feature flag.');
            return;
        }

        try {
            const signalR = await import('@microsoft/signalr').catch(() => null);
            if (!signalR) {
                console.info('SignalR package @microsoft/signalr not installed yet. Realtime service dormant.');
                return;
            }

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: getToken
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Warning)
                .build();

            subscriptionManager.setConnection(this.connection);

            this.connection.on('OnSignal', (envelope: any) => {
                notificationDispatcher.dispatch(envelope);
            });

            this.connection.onreconnected(async () => {
                this.isConnected = true;
                await subscriptionManager.resubscribeAll();
            });

            this.connection.onclose(() => {
                this.isConnected = false;
            });

            await this.connection.start();
            this.isConnected = true;
            console.log('SignalR connection established successfully to:', hubUrl);
        } catch (err) {
            console.warn('Failed to start SignalR connection:', err);
            this.isConnected = false;
        }
    }

    public async stop() {
        if (this.connection) {
            await this.connection.stop();
            this.isConnected = false;
        }
    }

    public isConnectionActive(): boolean {
        return this.isConnected;
    }
}

export const signalRService = new SignalRService();
