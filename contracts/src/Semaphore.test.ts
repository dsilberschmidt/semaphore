import { SemaphoreZkApp } from './Semaphore';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Poseidon,
  SmartContract,
  Bool,
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
  let   localBlockchain;

  beforeAll(async () => {
    //if (proofsEnabled) await SemaphoreZkApp.compile();
    await SemaphoreZkApp.compile();
    localBlockchain = await Mina.LocalBlockchain();
    Mina.setActiveInstance(localBlockchain);
    deployerAccount = localBlockchain.testAccounts[0];
    zkApp = new SemaphoreZkApp(deployerAccount);

    // Deploy the zkApp
    const deployTxn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await deployTxn.send().wait();

    // Fetch the zkApp account to ensure it's in the ledger
    await localBlockchain.getAccount(zkApp.address);
    
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
    
  // Alternatively, ensure preconditions are set in the zkApp methods being tested
    expect(await zkApp.merkleRoot.get()).toEqual(Field(0));
    expect(await zkApp.nullifier.get()).toEqual(Field(0));
    expect(await zkApp.identityCommitment.get()).toEqual(Field(0));
  });

  
  it('generates an identity commitment and updates state', async () => {
    const secret = new Field(123456); // Ensure this matches the secret used in actual zkApp calls
    await zkApp.generateIdentity(secret);
    const publicKey = zkApp.generatePublicKey(secret);
    const expectedIdentityCommitment = Poseidon.hash([publicKey.x, publicKey.y]);
  
    const actualIdentityCommitment = await zkApp.identityCommitment.get();
    expect(actualIdentityCommitment).toEqual(expectedIdentityCommitment);
  });

  it('verifies membership with a valid Merkle proof', async () => {
    await localDeploy();
    const secret = new Field(123456);
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