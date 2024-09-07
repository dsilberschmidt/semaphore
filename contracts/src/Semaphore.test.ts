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
      //AccountUpdate.fundNewAccount(senderAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
    //await txn.sign([deployerKey]).send();
  }

    //await localDeploy();  

  it('initializes and deploys the SemaphoreZkApp with default values', async () => {
    await localDeploy();
    const identityCommitmentState = zkApp.identityCommitment.get();
    const nullifierState = zkApp.nullifier.get();

    expect(identityCommitmentState).toEqual(Field(0));
    expect(nullifierState).toEqual(Field(0));
  });

 
  it('generates an identity commitment and updates state', async () => {
    const secret = new Field(123456); // Ensure this matches the secret used in actual zkApp calls
    await zkApp.generateIdentity(secret);
    const publicKey = zkApp.generatePublicKey(secret);
    const expectedIdentityCommitment = Poseidon.hash([publicKey.x, publicKey.y]);
  
    const actualIdentityCommitment = zkApp.identityCommitment.get();
    expect(actualIdentityCommitment).toEqual(expectedIdentityCommitment);
  });

  /* it('verifies membership with a valid Merkle proof', async () => {
    //await localDeploy();
    const secret = new Field(123456);
    await zkApp.generateIdentity(secret);
    const merkleProof = {
      indices: [Field(1), Field(0)],
      siblings: [Field(2), Field(3)]
    };
    await zkApp.verifyMembership(merkleProof);
    const computedRoot = zkApp.computeMerkleRoot(zkApp.identityCommitment.get(), merkleProof);
    expect(computedRoot).toEqual(zkApp.merkleRoot.get());
  });

  it('generates a nullifier based on scope and secret', async () => {
    //await localDeploy();
    const scope = Field(67890);
    const secret = Field(12345);
    await zkApp.generateNullifier(scope, secret);
    const expectedNullifier = Poseidon.hash([scope, secret]);
    expect(zkApp.nullifier.get()).toEqual(expectedNullifier);
  }); */
});