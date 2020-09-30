let currentUser = null;
let currentProfileUser = null;
let contextHeading = '';

// // all posts (all) | posts of those the user follows (follows) | posts of a particular user (user)
// let postDisplayContext = 'all';


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

	// Handle routing to the following page
	document.querySelector('#nav__following').addEventListener('click', async () => {
		ReactDOM.unmountComponentAtNode(document.getElementById('profile__component'));
		load_posts(`following=${true}`);
		contextHeading = "People you follow"

	});

	// Initialise global variables
	await load_current_user();
	load_posts();
}

async function load_current_user() {
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
			fetch(`/user/${this.props.user_id}`)
			.then(response => {
				if (response.status.toString().charAt(0) === '2') return response.json();
				else return { error: response.status };
			})
			.then(result => {
				if (!result.error) {
					render_profile(result);
					load_posts(`user_id=${this.props.user_id}`);
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
	 				load_posts(`user_id=${this.props.user_id}`);
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
				<div>
					<h2>{ contextHeading }</h2>
					<div>{ list }</div>
				</div>
			);
		}
	}

	ReactDOM.render(<Posts />, document.querySelector("#posts__component"));
}


function render_profile(user) {
	contextHeading = `${user.name}'s posts`
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
