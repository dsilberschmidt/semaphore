import { SemaphoreZkApp } from './Semaphore';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';

let proofsEnabled = true;

describe('SemaphoreZkApp', () => {
  let deployerAccount: Mina.TestPublicKey,
    senderAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: SemaphoreZkApp;

  //let localBlockchain

  beforeAll(async () => {
    if (proofsEnabled) await SemaphoreZkApp.compile();

    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SemaphoreZkApp(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('initializes and deploys the SemaphoreZkApp with default values', async () => {
    await localDeploy();
    const identityCommitmentState = await zkApp.identityCommitment.get();
    const nullifierState = await zkApp.nullifier.get();

    expect(identityCommitmentState).toEqual(Field(0));
    expect(nullifierState).toEqual(Field(0));
  });

 /*  it('correctly updates the state on the SemaphoreZkApp', async () => {
    const secret = new Field(123456);
    await zkApp.generateIdentity(secret);
    const expectedIdentityCommitment = Poseidon.hash([zkApp.publicKey.x, zkApp.publicKey.y]);

    // Update transaction
    const txn = await Mina.transaction(senderAccount, async () => {
      zkApp.updateIdentityCommitment(new Field(123456)); // Assuming updateIdentityCommitment is a method you have
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const identityCommitmentState = await zkApp.identityCommitment.get();
    expect(identityCommitmentState).toEqual(expectedIdentityCommitment);

    console.log(`Updated identity commitment is ${identityCommitmentState.toString()}`);
  }); */
});