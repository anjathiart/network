let currentUser = null;
let currentProfileUser = null;
let contextHeading = '';
let pagination = {
	page: 1,
	limit: 10,
	numPages: 1,
}
let viewQuery = '';

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
	feather.replace();

	// load user
	await load_current_user();
	console.log(currentUser);
	
	// Handle routing to the following page
	if (currentUser) {
		document.querySelector('#nav__following').addEventListener('click', async () => {
			ReactDOM.unmountComponentAtNode(document.getElementById('profile__component'));
			document.querySelector('#profile__component').style.display = 'none';
			viewQuery = `following=${true}`;
			load_posts();
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

		load_posts();
	}
	
}

async function load_current_user() {
	await fetch(`/user/current`)
		.then(async response => await response.json())
		.then(result => {
			console.log(result)
			if (result.id) currentUser = result
	});
}

function renderPagination(page, num_pages, prev, next) {

	class Pagination extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				"page": parseInt(page, 10),
				"num_pages": parseInt(num_pages, 10),
				"prevClass": prev ? null : 'disabled',
				"nextClass": next ? null : 'disabled',
			};
		}
		render() {
			return (
				<div className="paginationWrapper">
					<h3 className="contextHeading">{ contextHeading }</h3>
					<ul className="pagination">
						<li onClick={ prev ? this.actionPagination.bind(this, 1) : null } className={ `page-item ${this.state.prevClass}` }><a className="page-link">first</a></li>
						<li onClick={ prev ? this.actionPagination.bind(this, this.state.page - 1) : null } className={ `page-item ${this.state.prevClass}` }><a className="page-link">previous</a></li>
						<li className="page-item active"><a className="page-link">{ `Page ${this.state.page} of ${this.state.num_pages}` }</a></li>
						<li onClick={ next ? this.actionPagination.bind(this, this.state.page + 1) : null } className={ `page-item ${this.state.nextClass}` }><a className="page-link">next</a></li>
						<li onClick={ next ? this.actionPagination.bind(this, this.state.num_pages) : null } className={ `page-item ${this.state.nextClass}` }><a className="page-link">last</a></li>
					</ul>
				</div>
			)
		}

		actionPagination = (selected_page) => {
			console.log(selected_page)
			if (selected_page !== this.state.page) {
				load_posts(`page=${selected_page}`)
			}
		}
	}

	ReactDOM.render(<Pagination />, document.querySelector("#pagination"));

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
				<div id={ "post" + this.props.id } className="post shadow1">
					<h4 onClick={ this.actionUser.bind(this, this.props.index) } className="post__header">
						{ this.props.name }
					</h4>
					<footer className="blockquote-footer post__subHeader text-small mb-2 mt-1"><cite title="Source Title">{ this.props.date }</cite></footer>
					
					<div className="newPost">
						{ this.state.editing
							? <textarea className="post__content" value={ this.state.modified_post_body } onChange={ (e) => this.setState({modified_post_body: e.target.value }) }>{ this.state.post_body }</textarea>
							: <p className="post__content">{ this.state.post_body }</p>
						}
					</div>
					<div className="post__footer pt-2 border-top mt-3">
						<p className="mr-3">
							<i data-feather="thumbs-up" className=""></i>
							<span>{ this.props.likes.length }</span>
						</p>
						{ !this.state.editing
							? 
							<p>
								<a onClick={ this.actionUpdateLike.bind(this, this.state.liked ? 'unlike' : 'like') } className="text-primary mr-3">{ this.state.liked ? 'Unlike' : 'Like' }</a>
								{ (currentUser.id === this.props.user_id) ? <a onClick={ this.actionEdit } className="text-secondary ml-2">Edit</a> : null }
							</p>
							:
							<p>
								<a onClick={ this.updatePost.bind(this, { body: this.state.modified_post_body }) } className="text-primary mr-3">Save</a>
								<a onClick={ this.cancelEdit } className="text-danger">Cancel</a>
							</p>
						}

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
					viewQuery = `user_id=${this.props.user_id}`;
					load_posts();
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
					viewQuery = `user_id=${this.props.user_id}`;
	 				load_posts();
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
					viewQuery = `user_id=${this.props.user_id}`;
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
	feather.replace()
}


function render_profile(user) {
	document.querySelector('#profile__component').style.display = 'block';
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
				<div className="jumbotron mb-0">
					<div className="jumbotron__header">
						<h1 className="display-4 mb-1">{ user.name }</h1>
						{ this.state.allowFollow
							? <p className="ml-4"><button className="btn btn-indigo" onClick={ this.actionFollow }>{ user.followers.indexOf(currentUser.id) >= 0 ? 'Unfollow' : 'Follow' }</button></p>
							: null
						}
					</div>
					<p className="profile__followers badge badge-info badge-pill shadow3">Followed by { user.followers.length } { user.followers.length === 1 ? 'user' : 'users' }</p>
					<p className="profile__follows badge badge-info badge-pill shadow3">{ user.name } follows { user.followsCount} { user.followsCount === 1 ? 'user' : 'users' }</p> 
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
function load_posts(q='') {
	let query = q + '&' + viewQuery;
	console.log(query)
	fetch(`/posts?${query}`)
		.then(response => response.json())
		.then(({posts, page, num_pages, prev, next}) => {
		ReactDOM.unmountComponentAtNode(document.getElementById('pagination'));
		// Print posts
		console.log(posts);
		// console.log(data.posts)
		// pagination.page = data.page
		// pagination.numPages = data.num_pages

		// ... do something else with posts ...
		renderPagination(page, num_pages, prev, next)
		renderPosts(posts)
	});
}
