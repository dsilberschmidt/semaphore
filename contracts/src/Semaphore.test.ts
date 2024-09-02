import { SemaphoreZkApp } from './Semaphore';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Poseidon,
  Signature,
  //isReady,
} from 'o1js';

let proofsEnabled = false;

describe('SemaphoreZkApp Tests', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: SemaphoreZkApp;

  beforeAll(async () => {
    if (proofsEnabled) await SemaphoreZkApp.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    deployerAccount = Local.testAccounts[0];
    deployerKey = deployerAccount.key;
    senderAccount = Local.testAccounts[1];
    senderKey = senderAccount.key;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SemaphoreZkApp(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('initializes the SemaphoreZkApp with default values', async () => {
    await localDeploy();
    expect(await zkApp.merkleRoot.get()).toEqual(Field(0));
    expect(await zkApp.nullifier.get()).toEqual(Field(0));
    expect(await zkApp.identityCommitment.get()).toEqual(Field(0));
  });

  it('generates an identity commitment and updates state', async () => {
    await localDeploy();
    const secret = Field(12345);
    await zkApp.generateIdentity(secret);
    const publicKey = zkApp.generatePublicKey(secret);
    const expectedIdentityCommitment = Poseidon.hash([publicKey.x, publicKey.y]);
    expect(await zkApp.identityCommitment.get()).toEqual(expectedIdentityCommitment);
  });

  it('verifies membership with a valid Merkle proof', async () => {
    await localDeploy();
    const secret = Field(12345);
    await zkApp.generateIdentity(secret);
    const merkleProof = {
      indices: [Field(1), Field(0)],
      siblings: [Field(2), Field(3)]
    };
    await zkApp.verifyMembership(merkleProof);
    const computedRoot = zkApp.computeMerkleRoot(await zkApp.identityCommitment.get(), merkleProof);
    expect(computedRoot).toEqual(await zkApp.merkleRoot.get());
  });

  it('generates a nullifier based on scope and secret', async () => {
    await localDeploy();
    const scope = Field(67890);
    const secret = Field(12345);
    await zkApp.generateNullifier(scope, secret);
    const expectedNullifier = Poseidon.hash([scope, secret]);
    expect(await zkApp.nullifier.get()).toEqual(expectedNullifier);
  });
});