<?php 
/**
 * EventON Docs
 * @version 5.0
 */

class EVO_Docs_REST{

public function run( $postdata){
 	// Get the ID or slug from the request (assuming it's passed via POST or GET)
    $id_or_slug = isset($postdata['id_or_slug']) ? sanitize_text_field($postdata['id_or_slug']) : '';

    if (empty($id_or_slug)) {
        wp_send_json(array(
            'status' => 'bad',
            'msg' => 'No article ID or slug provided.',
        ));
        wp_die();
    }

    // Construct the REST API URL
    $api_url = "https://docs.myeventon.com/wp-json/evodocs/v1/article/{$id_or_slug}";
    //EVO_Debug($api_url);

    // Make the API request
    $response = wp_remote_get($api_url, array(
        'timeout' => 15,
        'sslverify' => false, // Adjust based on your environment
    ));

    // Check for WP_Error
    if (is_wp_error($response)) {
        wp_send_json(array(
            'status' => 'bad',
            'msg' => 'Failed to fetch article: ' . $response->get_error_message(),
        ));
        wp_die();
    }

    // Get the response body
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    // Check if the API call was successful
    if (wp_remote_retrieve_response_code($response) === 200 && isset($data['content'])) {
        // Process [do_css] shortcode in the content
        $processed_content = preg_replace_callback(
            '/\[do_css\s+type=[\'"]blue_button[\'"]\s+text=[\'"](.*?)[\'"]\s+link=[\'"](.*?)[\'"]\]/',
            function($matches) {
                $text = esc_html($matches[1]);
                $link = esc_url($matches[2]);
                return sprintf('<a class="" href="%s" target="_blank">%s</a>', $link, $text);
            },
            $data['content']
        );

        wp_send_json(array(
            'status' => 'good',
            'content' => $processed_content,
            'title' => $data['title'],
            'permalink' => $data['permalink'],
        ));
    } else {
        wp_send_json(array(
            'status' => 'bad',
            'msg' => isset($data['message']) ? $data['message'] : 'Article not found or invalid response.',
        ));
    }

    wp_die();
}

}