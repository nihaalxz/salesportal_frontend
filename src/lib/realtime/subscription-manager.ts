export class SubscriptionManager {
    private activeGroups: Set<string> = new Set();
    private hubConnection: any | null = null;

    public setConnection(connection: any) {
        this.hubConnection = connection;
    }

    public async subscribe(groupName: string) {
        if (!groupName || this.activeGroups.has(groupName)) return;
        this.activeGroups.add(groupName);
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            try {
                await this.hubConnection.invoke('SubscribeToGroup', groupName);
            } catch (err) {
                console.warn('Failed to subscribe to group:', groupName, err);
            }
        }
    }

    public async unsubscribe(groupName: string) {
        if (!groupName || !this.activeGroups.has(groupName)) return;
        this.activeGroups.delete(groupName);
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            try {
                await this.hubConnection.invoke('UnsubscribeFromGroup', groupName);
            } catch (err) {
                console.warn('Failed to unsubscribe from group:', groupName, err);
            }
        }
    }

    public async resubscribeAll() {
        if (!this.hubConnection || this.hubConnection.state !== 'Connected') return;
        for (const groupName of this.activeGroups) {
            try {
                await this.hubConnection.invoke('SubscribeToGroup', groupName);
            } catch (err) {
                console.warn('Failed to resubscribe to group:', groupName, err);
            }
        }
    }
}

export const subscriptionManager = new SubscriptionManager();
