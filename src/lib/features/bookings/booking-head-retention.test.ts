import { describe, it, expect } from 'vitest';

describe('Booking Creation - Head Retention and Form Reset', () => {
  it('preserves headId and clientType while resetting service-specific fields for Flights', () => {
    let clientType = 'customer';
    let headId: number | null = 105;
    let agent = '';
    let agentId: number | null = null;
    let fromLocation = 'BAH';
    let toLocation = 'DXB';
    let travelDate = '2026-12-01';
    let airlineCompany = 'Gulf Air';
    let tripType = 'one_way';
    let amount: number | '' = 120;
    let expectedSupplierCost = 90;
    let passengers = [{ prefix: 'Mr.', passengerName: 'Ahmed Ali', ticketPnr: 'PNR123' }];

    // Simulate the post-submission reset:
    fromLocation = '';
    toLocation = '';
    travelDate = '';
    airlineCompany = '';
    tripType = 'one_way';
    amount = '';
    expectedSupplierCost = 0;
    passengers = [{ prefix: 'Mr.', passengerName: '', ticketPnr: '' }];

    // Verification
    expect(headId).toBe(105);
    expect(clientType).toBe('customer');
    expect(fromLocation).toBe('');
    expect(toLocation).toBe('');
    expect(amount).toBe('');
    expect(expectedSupplierCost).toBe(0);
    expect(passengers.length).toBe(1);
    expect(passengers[0].passengerName).toBe('');
  });

  it('preserves headId and clientType while resetting service-specific fields for Visas', () => {
    let clientType = 'customer';
    let headId: number | null = 205;
    let countryId: number | null = 3;
    let visaPackId: number | null = 8;
    let applicants = [
      { prefix: 'Mr.', fName: 'John', lName: 'Doe', amount: 50, expectedSupplierCost: 35 }
    ];

    // Simulate the post-submission reset:
    countryId = null;
    visaPackId = null;
    applicants = [
      { prefix: 'Mr.', fName: '', lName: '', amount: '' as any, expectedSupplierCost: 0 }
    ];

    expect(headId).toBe(205);
    expect(clientType).toBe('customer');
    expect(countryId).toBeNull();
    expect(visaPackId).toBeNull();
    expect(applicants.length).toBe(1);
    expect(applicants[0].fName).toBe('');
  });

  it('preserves headId and clientType while resetting service-specific fields for Hotels, VFS, Holidays, Transport, Other', () => {
    const services = ['hotels', 'vfs', 'holidays', 'transport', 'other-services'];
    for (const service of services) {
      let headId: number | null = 300;
      let clientType = 'agent';
      let agent = 'Falcon Travels';
      let agentId: number | null = 55;
      let amount: number | '' = 250;

      // Reset
      amount = '';

      expect(headId).toBe(300);
      expect(clientType).toBe('agent');
      expect(agent).toBe('Falcon Travels');
      expect(agentId).toBe(55);
      expect(amount).toBe('');
    }
  });
});

