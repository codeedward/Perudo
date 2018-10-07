<template>
  <div id="login">
    <h1>{{ msg2 }}</h1>
    <div>Login:<input type="text" v-model="login"/></div>
    <div>Password:<input type="password" v-model="password"/></div>
    <div><input v-on:click="signIn" type="button" value="Log in"/></div>
    <div><router-link to="/register">Register</router-link></div>
  </div>
</template>

<script>
import firebase from 'firebase'
export default {
  name: 'login',
  data () {
    return {
      msg2: 'This is login component',
      login: '',
      password: ''
    }
  },
  methods: {
      signIn: function(){
          firebase.auth().signInWithEmailAndPassword(this.login,this.password)
          .then(
              (user) =>
              {
                  this.$store.dispatch('setCurrentUser', {user: user.user})
                  this.$router.replace('/board');
              },
              (err) =>
              {
                  alert('Error: '+ err.message);
              }
          );
      }
  },
  mounted: function(){
    console.log("login mounted")
  }
}
</script>

<style>

</style>
