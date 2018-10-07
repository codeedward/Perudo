<template>
  <div id="registration">
    <h1>{{ msg2 }}</h1>
    <div>Login:<input type="text" v-model="login"/></div>
    <div>Password:<input type="password" v-model="password"/></div>
    <div><input v-on:click="signUp" type="button" value="Create user"/></div>
  </div>
</template>

<script>
import firebase from 'firebase'
export default {
  name: 'registration',
  data () {
    return {
      msg2: 'This is registration component',
      login: '',
      password: ''
    }
  },
  methods: {
      signUp: function(){
          firebase.auth().createUserWithEmailAndPassword(this.login,this.password)
          .then(
              (user) =>
              {
                  this.$router.replace('login');
              },
              (err) =>
              {
                  alert('Error: '+ err.message);
              }
          );
      }
  }
}
</script>

<style>

</style>
