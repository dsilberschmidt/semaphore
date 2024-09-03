import {
    SmartContract,
    method,
    state,
    State,
    Field,
    Poseidon,
    Group,
    Scalar,
    Struct
  } from 'o1js';
  
  class MerkleProof extends Struct({
    indices: Array(Field),
    siblings: Array(Field)
  }) {}
  export class SemaphoreZkApp extends SmartContract {
    @state(Field) public merkleRoot = State<Field>();
    @state(Field) public nullifier = State<Field>();
    @state(Field) public identityCommitment = State<Field>();
    
  
    @method async init() {
      super.init();
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
      this.merkleRoot.requireEquals(this.merkleRoot.get());
      let computedRoot = this.computeMerkleRoot(this.identityCommitment.get(), merkleProof);
      computedRoot.assertEquals(this.merkleRoot.get(), "Merkle root does not match");
    }
  
    @method async generateNullifier(scope: Field, secret: Field) {
      const nullifier = Poseidon.hash([scope, secret]);
      this.nullifier.set(nullifier);
    }
  
    //Following methods, originally private,  were made public 
    //  for testing purposes during development

/*     public generatePublicKey(secret: Field): { x: Field, y: Field } {
      const scalarSecret = Scalar.fromFields([secret]);
      // Perform scalar multiplication on the curve's base point
      const publicKeyPoint = Group.generator.scale(scalarSecret);
      const x = publicKeyPoint.x;
      const y = publicKeyPoint.y;
      return { x, y };
    } */
   
      public generatePublicKey(secret: Field): { x: Field, y: Field } {
        // Example: Using a constant Field value as the second field
        const additionalField = new Field(1);  // Adjust this value as needed for your application
        const scalarSecret = Scalar.fromFields([secret, additionalField]);
        const publicKeyPoint = Group.generator.scale(scalarSecret);
        return { x: publicKeyPoint.x, y: publicKeyPoint.y };
      }

    public computeMerkleRoot(leaf: Field, proof: MerkleProof): Field {
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
 
