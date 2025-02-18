import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  template: `
    <h1>Users</h1>
    <p>Here is a list of users:</p>
    <ul>
      <li>User 1</li>
      <li>User 2</li>
      <li>User 3</li>
    </ul>
  `,
})
export class UsersComponent {
  title = 'Users';
}
