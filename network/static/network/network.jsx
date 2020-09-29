let currentUser = null;

// all posts (all) | posts of those the user follows (follows) | posts of a particular user (user)
let postDisplayContext = 'all';


if( document.readyState !== 'loading' ) {
    console.log( 'document is already ready, just execute code here' );
    myInitCode();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log( 'document was not ready, place code here' );
        myInitCode();
    });
}


async function myInitCode() {
	


	// Use buttons to toggle between views
	/*document.querySelector('#main').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', () => compose_email());
	document.querySelector('#sendMail').addEventListener('click', send_email);*/

	document.querySelector('#nav__allPosts').addEventListener('click', async () => {
		// await load_current_user();
	});

	// Initialise global variables
	postDisplayContext = 'all';
	await load_current_user();
	load_posts();
}

async function load_current_user() {
	console.log('load current')
	await fetch(`/user/current`)
		.then(async response => await response.json())
		.then(result => {
			currentUser = result
	});
}

function renderPosts(posts) {

	class Post extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				"post_id": props.id,
				"liked": props.likes.indexOf(parseInt(currentUser.id, 10)) >= 0,
				"editing": false,
				"post_body": props.body,
				"modified_post_body": props.body,
			};
		}
		render() {
			return (
				<div id={ "post" + this.props.id }>
					<div className="post__header">
						<p onClick={ this.actionUser.bind(this, this.props.index) }>{ this.props.name }</p>
						{ (currentUser.id === this.props.user_id) ? <button onClick={ this.actionEdit }>Edit</button>  : null }
					</div>
					<p className="post__date">{ this.props.date }</p>
					{ this.state.editing
						? <div>
							<textarea className="post__content" value={ this.state.modified_post_body } onChange={ (e) => this.setState({modified_post_body: e.target.value }) }>{ this.state.post_body }</textarea>
							<button onClick={ this.cancelEdit }>Cancel</button>
							<button onClick={ this.updatePost.bind(this, { body: this.state.modified_post_body }) }>Save</button>
						</div>
						: <p className="post__content">{ this.state.post_body }</p>
					}
					



					<div className="post__footer">
						<p>Number Likes: { this.props.likes.length }</p>
						<button onClick={ this.updatePost.bind(this, { liked: !this.state.liked }) }>{ this.state.liked ? 'Unlike' : 'Like' }</button>
					</div>
					
				</div>
			);
		}

		actionUser = (post_index) => {
			let user_id = posts[parseInt(post_index, 10)].userId;
			postDisplayContext = 'user';
			let userProfile = [];
			fetch(`/user/${user_id}`)
			.then(response => {
				if (response.status.toString().charAt(0) === '2') return response.json();
				else return { error: response.status };
			})
			.then(result => {
				if (!result.error) {
					render_profile(result);
					load_posts(`user_id=${user_id}`);
				}
			})
			.catch((error) => {
				console.error('Error', error);
			});
		}

		actionEdit = () => { this.setState(state => ({ editing: true })); }

		cancelEdit = () => {
			this.setState(state => ({ 
				editing: false,
				modified_post_body: this.state.post_body
			}));
		}

		updatePost = (fields) => {
			let csrftoken = Cookies.get('csrftoken');

			fetch(`posts/${this.state.post_id}/update`, {
				method: 'PUT',
				body: JSON.stringify(fields),
				headers: { "X-CSRFToken": csrftoken },
				credentials: 'same-origin',

			}).then(response => {
				if (response.status.toString().charAt(0) === '2') {
	 				load_posts();
				} else {
					// TODO
				}
			});

		}

	}

	// Build the list of posts card components for the mailbox content
	let list = [];
	for (let i = 0; i < posts.length; i += 1) {
		list.push(<Post name={ posts[i].name } date={ posts[i].created }  index={ i } id={ posts[i].id } likes={ posts[i].likes } body={ posts[i].body } user_id={ posts[i].userId } key={ posts[i].id }/>)
	}

	class Posts extends React.Component {
		render() {
			return (
				<div>{ list }</div>
			);
		}
	}

	ReactDOM.render(<Posts />, document.querySelector("#posts__component"));

	// Open an email when the email card object is clicked on
	// TODO: this should be a method of the EmailCard class
	// document.querySelectorAll('.emailCard').forEach(el => {
	// 	el.addEventListener('click', (event) => {
	// 		let emailIndex = el.id.replace('email', '')
	// 		view_email(emails[emailIndex])
	// 	})
	// })
}


function render_profile(user) {
	console.log(user)
	class Profile extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				allowFollow: user.id !== currentUser.id,
			};
		}
		render() {
			return (
				<div className="profile">
					<h3 className="profile__heading">{ user.name }'s Profile</h3>
					<p className="profile__followers">Followed by { user.followers.length } { user.followers.length === 1 ? 'user' : 'users' }</p>
					<p className="profile__follows">{ user.name } follows { user.followsCount} { user.followsCount === 1 ? 'user' : 'users' }</p> 
					{ this.state.allowFollow
						? <button onClick={ this.actionFollow }>{ user.followers.indexOf(currentUser.id) >= 0 ? 'Unfollow' : 'Follow' }</button>
						: null
					}
				</div>
			);
		}

		actionFollow = async () => {
			let csrftoken = Cookies.get('csrftoken');

			let status = await fetch(`user/${user.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					follow: (user.followers.indexOf(currentUser.id) >= 0) ? false : true
				}),
				headers: { "X-CSRFToken": csrftoken },
				credentials: 'same-origin',

			}).then(response => {
				if (response.status.toString().charAt(0) === '2') return response.json();
				else return { error: response.status };
			}).then(async result => {
				if (!result.error) {
					await load_current_user()
					render_profile(result)
				}
			})
			.catch((error) => {
				console.error('Error', error);
			});
		}
	}

	ReactDOM.render(<Profile />, document.querySelector("#profile__component"));

}



// Load posts based on some context, where the default context is all posts
// ... other options are to load posts of a specific user or all posts for users that the 
// ... authenticated user is following
function load_posts(query='') {
	fetch(`/posts?${query}`)
		.then(response => response.json())
		.then(posts => {

		// Print posts
		console.log(posts);
		// ... do something else with posts ...
		renderPosts(posts)
	});
}

function compose_email(sentEmail) {

	// Hide compose view message divs
	document.querySelector('.message--success').style.display = 'none'
	document.querySelector('.message--success').classList.remove('animateMessage');
	document.querySelector('.message--error').style.display = 'none';
	document.querySelector('.message--error').classList.remove('animateMessage');

	// Show compose view and hide other views
	clearReactDom()
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';

	// Populate the composition fields if user is replying to the 'sentEmail'
	if (sentEmail) {
		document.querySelector('#compose-recipients').value = sentEmail.sender;
		document.querySelector('#compose-subject').value = (sentEmail.subject.trim().substring(0,3) === 'Re:')
			? sentEmail.subject
			: `Re: ${sentEmail.subject}`;

		let body = `\n~On ${sentEmail.timestamp}, ${sentEmail.sender} wrote:\n${sentEmail.body}`
		document.querySelector('#compose-body').value = body;
	}

}

function load_mailbox(mailbox) {

	// Show the mailbox and hide other views
	clearReactDom()
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';

	// Show the mailbox name
	document.querySelector('#emails-view__heading').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

	fetch(`/emails/${mailbox}`)
		.then(response => response.json())
		.then(emails => {

		// Print emails
		console.log(emails);

		// ... do something else with emails ...
		renderEmailsView(emails)
	});
}

function send_email() {

	const subject = document.querySelector('#compose-subject').value;
	const recipients = document.querySelector('#compose-recipients').value;
	const body = document.querySelector('#compose-body').value;

	const messageSuccess = document.querySelector('.message--success');
	const messageError = document.querySelector('.message--error');
	messageSuccess.classList.remove('animateMessage');
	messageError.classList.remove('animateMessage');
	messageSuccess.style.display = 'none';
	messageError.style.display = 'none';

	// TODO: validate input

	fetch('/emails', {
		method: 'POST',
		body: JSON.stringify({
			recipients,
			subject,
			body,
		})
	})
	.then(response => {
		// intercept response
		return response.status;
	})
	.then(result => {

		// Print result
	    console.log(result);

	    // Show and animate email sent status message
		if (result === 200 || result === 201) {
			messageSuccess.style.display = 'block';
			messageSuccess.classList.add('animateMessage');
			setTimeout(function() {
		    	// Email is sent succuessfullly so show the 'sent' mailbox
		    	load_mailbox('sent');
	    	}, 2000);
		} else if (result === 400) {
			// Error sending email so show 
			messageError.style.display = 'block';
			messageError.classList.add('animateMessage');
		}
	})
	.catch((error) => {
		console.error('Error', error);
	});
}


function view_email(email) {

	// Get the current mailbox that the email was selected from
	const mailbox = (document.querySelector('#emails-view__heading').innerHTML).toLowerCase();

	// Show the mailbox and hide other views
	clearReactDom();
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#readEmail-view').style.display = 'block';

	// mark the email as being read if not already read
	if (!email.read) {
		fetch(`/emails/${email.id}`, {
			method: 'PUT',
			body: JSON.stringify({
				read: true,
			})
		})
		.then(result => {
			// Print result
			console.log(result);
		})
		.catch((error) => {
			console.error('Error', error)
		});
	}

	class ReadEmail extends React.Component {
		
		constructor(props) {
          super(props);
          this.state = {
            archived: email.archived,
            showButtons: mailbox !== 'sent',
          };
        }

		render() {
			return (
				<div className="readEmail" id="email.id">
					<div className="readEmail__header">
						<p><strong>From: </strong>{ email.sender }</p>
						<p><strong>To: </strong>{ email.recipients }</p>
						<p><strong>Subject: </strong>{ email.subject }</p>
						<p><strong>Timestamp: </strong>{ email.timestamp }</p>
					</div>
					{ this.state.showButtons ?
					<div className="readEmail__action">
						<button className="btn btn-sm btn-outline-primary" onClick={ this.actionReply }>Reply</button>
						<button className="btn btn-sm btn-outline-secondary" onClick={ this.actionArchive }>
							{ this.state.archived ? 'Un-Archive' : 'Archive' }
						 </button>
					</div>
					: null }
					<hr/>
					<p className="readEmail__body">{ email.body }</p>
        		</div>
			);
		}

		// Archive / Un-archive email method
		actionArchive = () => {
			fetch(`/emails/${email.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					archived: !email.archived
				})
			})
			.then(result => {
				// update state
				this.setState(state => ({
					archived: !state.archived
				}));
			})
			.catch((error) => {
				console.error('Error', error)
			});
		}

		// Reply method
		actionReply = () => {
			compose_email(email);
		}
	}

	ReactDOM.render(<ReadEmail />, document.querySelector("#readEmail-view"));
}

function renderEmailsView(emails) {
	
	class EmailCard extends React.Component {

		render() {
			return (
				<div className={"emailCard " + (this.props.read === true ? 'bgGray' : 'bgWhite')} id={"email" + this.props.index}>
					<p className="emailCard--sender">{this.props.sender}</p>
					<p className="emailCard--subject">{this.props.subject}</p>
					<p className="emailCard--date">{this.props.timestamp}</p>
        		</div>
			);
		}
	}

	// Build the list of email card components for the mailbox content
	let list = [];
	for (let i = 0; i < emails.length; i += 1) {
		list.push(<EmailCard sender={emails[i].sender} subject={emails[i].subject} timestamp={emails[i].timestamp} index={i} read={emails[i].read} />)
	}

	class EmailList extends React.Component {
		render() {
			return (
				<div>{ list }</div>
			);
		}
	}

	ReactDOM.render(<EmailList />, document.querySelector("#emails-view__component"));

	// Open an email when the email card object is clicked on
	// TODO: this should be a method of the EmailCard class
	document.querySelectorAll('.emailCard').forEach(el => {
		el.addEventListener('click', (event) => {
			let emailIndex = el.id.replace('email', '')
			view_email(emails[emailIndex])
		})
	})
}

// Unmount the react components
function clearReactDom() {
	 ReactDOM.unmountComponentAtNode(document.getElementById('emails-view__component'));
	 ReactDOM.unmountComponentAtNode(document.getElementById('readEmail-view'));
}






