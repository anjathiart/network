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

	feather.replace()
	// Handle routing to the following page
	document.querySelector('#nav__following').addEventListener('click', async () => {
		ReactDOM.unmountComponentAtNode(document.getElementById('profile__component'));
		load_posts(`following=${true}`);
		contextHeading = "People you follow"

	});

	document.querySelector(".newPost__submit").addEventListener('click', () => {
		let csrftoken = Cookies.get('csrftoken');

			fetch(`posts`, {
				method: 'POST',
				body: JSON.stringify({
					body: document.querySelector(".newPost__input").value
				}),
				headers: { "X-CSRFToken": csrftoken },
				credentials: 'same-origin',

			}).then(response => {
				if (response.status.toString().charAt(0) === '2') {
	 				load_posts();
				} else {
					// TODO
				}
			});
	})

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
				<div id={ "post" + this.props.id } className="post">
					<div className="post__header">
						<i data-feather="user"></i>
						<h5 onClick={ this.actionUser.bind(this, this.props.index) }>{ this.props.name }</h5>
					</div>
					<div className="post__subHeader">
						{ (currentUser.id === this.props.user_id) ? <p onClick={ this.actionEdit } className="link">Edit</p>  : null }
						<p className="post__date">{ this.props.date }</p>
					</div>
					{ this.state.editing
						? <div className="newPost">
							<textarea className="post__content" value={ this.state.modified_post_body } onChange={ (e) => this.setState({modified_post_body: e.target.value }) }>{ this.state.post_body }</textarea>
							<a onClick={ this.cancelEdit } className="link">Cancel</a>
							<button onClick={ this.updatePost.bind(this, { body: this.state.modified_post_body }) } className="btn btn-primary">Save</button>
						</div>
						: <p className="post__content">{ this.state.post_body }</p>
					}
					<div className="post__footer">
						<p>
							<i data-feather="thumbs-up"></i>
							<span>{ this.props.likes.length }</span>
						</p>
						<button onClick={ this.actionUpdateLike.bind(this, this.state.liked ? 'unlike' : 'like') } className="btn btn-primary">{ this.state.liked ? 'Unlike' : 'Like' }</button>
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

		actionUpdateLike = (action) => {
			let csrftoken = Cookies.get('csrftoken');
			fetch(`posts/${this.state.post_id}/${action}`, {
				method: 'PUT',
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

		updatePost = (fields) => {
			let csrftoken = Cookies.get('csrftoken');

			fetch(`posts/${this.state.post_id}/edit`, {
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
	feather.replace()
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
	feather.replace()

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
