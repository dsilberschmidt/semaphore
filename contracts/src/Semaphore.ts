import {
    SmartContract,
    method,
    state,
    State,
    Field,
    Poseidon,
    Group,
    Scalar,
    PrivateKey,
    PublicKey,
  } from 'o1js';
  
  export class SemaphoreZkApp extends SmartContract {
    @state(Field) public merkleRoot = State<Field>();
    @state(Field) public nullifier = State<Field>();
    @state(Field) public identityCommitment = State<Field>();
  
    @method async init() {
      this.merkleRoot.set(new Field(0));
      this.nullifier.set(new Field(0));
      this.identityCommitment.set(new Field(0));
    }
  
    @method async generateIdentity(secret: Field) {
      const publicKey = this.generatePublicKey(secret);
      const identityCommitment = Poseidon.hash([publicKey.x, publicKey.y]);
      this.identityCommitment.set(identityCommitment);
    }
  
    @method async verifyMembership(merkleProof: MerkleProof) {
      let computedRoot = this.computeMerkleRoot(this.identityCommitment.get(), merkleProof);
      computedRoot.assertEquals(this.merkleRoot.get(), "Merkle root does not match");
    }
  
    @method async generateNullifier(scope: Field, secret: Field) {
      const nullifier = Poseidon.hash([scope, secret]);
      this.nullifier.set(nullifier);
    }
  
    private generatePublicKey(secret: Field): { x: Field, y: Field } {
      // Convert the Field element to a scalar
      const scalarSecret = Scalar.fromFields([secret]);
      
      // Perform scalar multiplication on the curve's base point
      const publicKeyPoint = Group.generator.scale(scalarSecret);
      
      // Extract the x and y coordinates from the resulting group element
      const x = publicKeyPoint.x;
      const y = publicKeyPoint.y;
      
      // Return the coordinates as an object
      return { x, y };
    }

    private computeMerkleRoot(leaf: Field, proof: MerkleProof): Field {
      let currentHash = leaf;
      for (let i = 0; i < proof.indices.length; i++) {
        if (proof.indices[i].equals(new Field(1))) {
          currentHash = Poseidon.hash([proof.siblings[i], currentHash]);
        } else {
          currentHash = Poseidon.hash([currentHash, proof.siblings[i]]);
        }
      }
      return currentHash;
    }
  }
  
  interface MerkleProof {
    indices: Field[];
    siblings: Field[];
  }