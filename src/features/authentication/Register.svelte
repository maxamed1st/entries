<script>
  import { createUserWithEmailAndPassword } from "firebase/auth";
  import { auth } from "../../lib/firebase";
  import { navigate } from "svelte-routing";
  let username = "";
  let email = "";
  let password = "";
  const handleSingUp = async (e) => {
    try {
      //register and sign in user with email and password
      await createUserWithEmailAndPassword(auth, email, password);
      //reset form
      username = "";
      email = "";
      password = "";
      //redirect to folders page
      navigate("/folders");
    } catch (err) {
      throw err;
    }
  };
</script>

<form on:submit|preventDefault={handleSingUp} class="form-control">
  <label for="username" class="label"> Username </label>
  <input
    type="text"
    id="username"
    name="username"
    bind:value={username}
    required
    class="input bg-neutral text-neutral-content w-full"
  />

  <label for="email" class="label"> Email </label>
  <input
    type="text"
    id="email"
    name="email"
    bind:value={email}
    required
    class="input bg-neutral text-neutral-content w-full"
  />

  <label for="password" class="label"> Password </label>
  <input
    type="password"
    id="password"
    name="password"
    bind:value={password}
    required
    class="input bg-neutral text-neutral-content w-full"
  />

  <button type="submit" class="btn btn-accent mt-4"> signup </button>
</form>

<style>
  input {
    border: 1px, solid, black;
  }
</style>
