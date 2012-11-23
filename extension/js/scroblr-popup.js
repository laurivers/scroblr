var scroblrBar = (function (model) {

	var currentTrack, keepalive;

	currentTrack = null;
	keepalive    = null;

	function initialize () {
		attachBehaviors();
		resetBar();
		initializeUserForm();

		if (model.currentTrack) {
			updateNowPlaying(model.currentTrack);
		}
	}

	function attachBehaviors () {
		$("#lastfmLoginForm").bind("submit", function (e) {
			var user = $("#lastfmLoginName").val().toLowerCase();
			e.preventDefault();
			model.messageHandler({name: "loginFormSubmitted", message: user});
		});

		$("#lastfmLogoutLink").click(function (e) {
			e.preventDefault();
			model.messageHandler({name: "logoutLinkClicked"});
		});

		$("#lastfmCancelAuthLink").click(function (e) {
			e.preventDefault();
			model.messageHandler({name: "cancelAuthLinkClicked"});
		});

		$("#lastfmLoveTrackLink").click(function (e) {
			e.preventDefault();
			if ($(this).hasClass("loved")) {
				model.messageHandler({name: "unloveTrack"});
			} else {
				model.messageHandler({name: "loveTrack"});
			}

			$(this).toggleClass("loved");
		});

		$(".navigation").on("click", "a", function (e) {
			e.preventDefault();
			handleNavigationClick.call(this, e);
		});

		chrome.extension.onRequest.addListener(messageHandler);
	}

	function formatDuration (duration) {
		var seconds_total = duration / 1000,
				hours   = Math.floor(seconds_total / 3600),
				minutes = Math.floor((seconds_total - (hours * 3600)) / 60),
				seconds = Math.round((seconds_total - (hours * 3600)) % 60),
				formatted_hour = "";

		if (hours > 0) {
			formatted_hour = hours + ":";

			if (minutes.toString().length < 2) {
				minutes = "0" + minutes;
			}
		}

		if (seconds.toString().length < 2) {
			seconds = "0" + seconds;
		}

		return formatted_hour + minutes + ":" + seconds;
	}

	function handleNavigationClick(e) {
		var $target = $(this);
		var $parent = $target.parent();
		$(".navigation li").removeClass();
		$parent.addClass("is-selected");
		$("section").hide();
		$($target.attr("href")).show();
	}

	function initializeUserForm (waiting) {
		var userImage, userLink;

		$("#auth form, #auth > p").hide();

		if (waiting) {
			$("#lastfmWaitingAuth").show();
		} else if (!model.lf_session) {
			$("#lastfmLoginForm").show();
		} else {
			$("#lastfmAccountDetails").show();
			$("#lastfmUsername").text(model.lf_session.name);

			if (localStorage.lf_image) {
				userImage = '<img height="20" width="20" src="' + localStorage.lf_image + '" alt="" />';
				userLink = '<a href="http://last.fm/user/' + model.lf_session.name + '" target="_blank">' + userImage + '</a>';
				$("#lastfmUserimage").html(userLink);
			} else {
				$("#lastfmUserimage").empty();
				model.getUserInfo(model.lf_session.name);
			}
		}
	}

	function keepAlive () {
		window.clearTimeout(keepalive);
		keepalive = window.setTimeout(resetBar, 15000);
	}

	function messageHandler (msg) {
		switch (msg.name) {
		case "initUserForm":
			initializeUserForm(msg.message);
			break;
		case "keepAlive":
			keepAlive();
			break;
		case "nowPlaying":
			updateNowPlaying(msg.message);
			break;
		case "songInfoRetrieved":
			updateNowPlaying(msg.message);
			break;
		case "updateCurrentTrack":
			updateCurrentTrack(msg.message);
			break;
		}
	}

	function resetBar () {
		$(".now-playing p, .album-art").empty();
		$(document.body).removeClass();
		$("#lastfmWaitingAuth").hide();
		updateCurrentTrack({score: 50});
	}

	function updateNowPlaying (data) {
		var duration, imageTag, nowPlaying;

		currentTrack = data;
		nowPlaying   = $(".now-playing");

		resetBar();

		if (data.title && data.artist) {
			$(document.body).addClass(data.host);

			if (data.image) {
				$(".album-art").html("<img src=\"" + data.image + "\" />");
			}

			duration = (data.duration > 0 ? formatDuration(data.duration) : "");
			$(".track", nowPlaying).html(data.title);
			$(".artist", nowPlaying).html(data.artist);
			$(".album", nowPlaying).html(data.album);
			updateCurrentTrack({score: data.score});
		}
	}

	function updateCurrentTrack (data) {
		var $score = $(".score").hide();

		// if (data.duration) {
		// 	currentTrack.duration = data.duration;
		// 	$(".now-playing .track em").text(formatDuration(data.duration));
		// }

		if (data.score) {
			$score.removeClass("is-bad is-good");
			$score.html(data.score + "%").show();

			if (data.score > 50) {
				$score.addClass("is-good");
			} else if (data.score < 50) {
				$score.addClass("is-bad");
			}
		}
	}

	initialize();

	return {
		initializeUserForm: initializeUserForm
	};
}(chrome.extension.getBackgroundPage()));
