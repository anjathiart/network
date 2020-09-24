if( document.readyState !== 'loading' ) {
    console.log( 'document is already ready, just execute code here' );
    myInitCode();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log( 'document was not ready, place code here' );
        myInitCode();
    });
}

function myInitCode() {
	
	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', () => compose_email());
	document.querySelector('#sendMail').addEventListener('click', send_email);

	// By default, load the inbox
	load_mailbox('inbox');
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






